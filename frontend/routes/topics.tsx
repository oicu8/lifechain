import * as React from "react";
import MediaQuery from "react-responsive";
import { I18n } from "react-i18next";

import { LifeChain, UserInfo } from "../lib/lifechain";
import {
  FeedInfo,
  Summary,
  generateSummaryFromHTML,
  generateFeedInfoFromTransactionInfo
} from "../lib/feed";

import { checkUserRegistration, checkNetworkId } from "../lib/utility";
import { renderMarkdown } from "../lib/markdown";

import Footer from "../components/footer";
import Edit from "../components/edit";
import FeedCard from "../components/feed-card";
import ProfileCard from "../components/profile-card";
import AnnouncementCard from "../components/announcement-card";
import TopicsCard from "../components/topics-card";
import FollowingsCard from "../components/followings-card";
import Header, { Page } from "../components/header";
import Error from "../components/error";
import i18n from "../i18n/i18n";

enum TopicSorting {
  ByTrend,
  ByTime
}

interface FeedEntry {
  blockNumber: number;
  creation: number;
  topic: string;
}

interface Props {
  lifechain: LifeChain;
  networkId: number;
}
interface State {
  showEditPanel: boolean;
  msg: string;
  feedEntries: FeedEntry[]; // starting block numbers
  feeds: FeedInfo[];
  loading: boolean;
  doneLoadingAll: boolean;
  userInfo: UserInfo;
}
export default class Topics extends React.Component<Props, State> {
  private lastFeedCard: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      showEditPanel: false,
      msg: "",
      feedEntries: [],
      feeds: [],
      loading: false,
      doneLoadingAll: false,
      userInfo: null
    };
  }

  componentDidMount() {
    const lifechain = this.props.lifechain;
    document.body.scrollTop = 0;
    checkNetworkId(lifechain, this.props.networkId);
    checkUserRegistration(lifechain);
    this.updateUserInfo(lifechain);
    this.showUserTopics(lifechain);
    this.bindWindowScrollEvent();
  }

  componentWillReceiveProps(newProps: Props) {
    // in order to get click in Header home tab to reload home page.
    // console.log('home will receive props')
    // if (this.props.lifechain !== newProps.lifechain) {
    document.body.scrollTop = 0;
    checkNetworkId(newProps.lifechain, newProps.networkId);
    checkUserRegistration(newProps.lifechain);
    this.updateUserInfo(newProps.lifechain);
    this.showUserTopics(newProps.lifechain);
    this.bindWindowScrollEvent();
    // }
  }

  componentWillUnmount() {
    // TODO: Stop loading home feeds.
  }

  updateUserInfo(lifechain: LifeChain) {
    if (!lifechain) return;
    lifechain.getUserInfoFromAddress(lifechain.accountAddress).then(userInfo => {
      this.setState({
        userInfo
      });
    });
  }

  async showUserTopics(lifechain: LifeChain) {
    if (!lifechain) return;
    // initialize feedEntries:
    const feedEntries: FeedEntry[] = [];
    const creation = Date.now();
    // TODO: change followingUsernames to followingUsers and store their addresses instead of usernames.
    for (let i = 0; i < lifechain.settings.followingTopics.length; i++) {
      const topic = lifechain.settings.followingTopics[i].topic;
      if (topic) {
        let blockNumber;
        blockNumber = parseInt(
          await lifechain.contractInstance.methods
            .getCurrentTagInfoByTrend(lifechain.formatTag(topic))
            .call()
        );
        feedEntries.push({
          blockNumber,
          creation,
          topic
        });
      }
    }
    this.setState(
      {
        feedEntries,
        loading: false,
        doneLoadingAll: false,
        feeds: []
      },
      () => {
        this.showTopicsFeeds();
      }
    );
  }

  showTopicsFeeds() {
    const feedEntries = this.state.feedEntries;
    const lifechain = this.props.lifechain;
    if (!feedEntries.length) {
      return this.setState({
        loading: false,
        doneLoadingAll: true
      });
    }
    if (this.state.loading) {
      // console.log(`it's loading...`)
      return;
    }
    this.setState(
      {
        loading: true
      },
      async () => {
        let maxBlockNumber = feedEntries[0].blockNumber;
        let maxCreation = feedEntries[0].creation;
        let maxTopic = feedEntries[0].topic;
        let maxOffset = 0;
        feedEntries.forEach((homeFeedsEntry, offset) => {
          if (
            homeFeedsEntry.blockNumber > maxBlockNumber ||
            (homeFeedsEntry.blockNumber === maxBlockNumber &&
              homeFeedsEntry.creation > maxCreation)
          ) {
            maxBlockNumber = homeFeedsEntry.blockNumber;
            maxCreation = homeFeedsEntry.creation;
            maxTopic = homeFeedsEntry.topic;
            maxOffset = offset;
          }
        });
        const formattedTag = lifechain.formatTag(maxTopic);
        // console.log("showTopicsFeeds", maxBlockNumber, maxCreation, maxUserAddress)
        const transactionInfo = await lifechain.getTransactionInfo(
          {
            tag: formattedTag,
            blockNumber: maxBlockNumber,
            maxCreation: maxCreation
          },
          (blockNumber, index, total) => {
            if (index >= 0) {
              this.setState({
                msg: i18n.t("notification/Syncing-block-from-blockchain", {
                  index: index + 1,
                  total,
                  blockNumber
                })
              });
            } else {
              this.setState({
                msg: i18n.t("notification/Syncing-block-from-database", {
                  blockNumber
                })
              });
            }
          }
        );

        if (!transactionInfo) {
          feedEntries.splice(maxOffset, 1); // finish loading all feeds from user.
          return this.setState(
            {
              loading: false
            },
            () => {
              this.scroll();
            }
          );
        } else {
          const eventLog = transactionInfo.decodedLogs.filter(
            x =>
              x.name === "SavePreviousTagInfoEvent" &&
              x.events["tag"].value === formattedTag
          )[0];
          let blockNumber;
          if (eventLog) {
            blockNumber = parseInt(eventLog.events["previousTagInfoBN"].value);
          } else {
            blockNumber = transactionInfo.blockNumber;
          }
          const feedEntry = feedEntries[maxOffset];
          feedEntry.blockNumber = blockNumber;
          feedEntry.creation = transactionInfo.creation;

          const feedInfo = await generateFeedInfoFromTransactionInfo(
            this.props.lifechain,
            transactionInfo
          );
          const feeds = this.state.feeds;
          if (feedInfo.feedType === "upvote") {
            // filter out existing content
            feedInfo.feedType = "post";
            feedInfo.repostUserInfo = null;
          }

          let find = false;
          for (const displayedFeedInfo of feeds) {
            if (
              displayedFeedInfo.transactionInfo.hash ===
              feedInfo.transactionInfo.hash
            ) {
              find = true;
              console.log("find same post");
              break;
            }
          }
          if (!find) {
            feeds.push(feedInfo);
          }

          this.setState(
            {
              feeds,
              feedEntries
            },
            () => {
              this.setState(
                {
                  loading: false
                },
                () => {
                  // this.showTopicsFeeds();
                  this.scroll();
                }
              );
            }
          );
        }
      }
    );
  }

  bindWindowScrollEvent() {
    window.onscroll = this.scroll;
  }

  scroll = () => {
    if (this.state.doneLoadingAll) {
      return;
    } else {
      const scrollTop = document.body.scrollTop;
      const offsetHeight = document.body.offsetHeight;
      const middlePanel = document.querySelector(
        ".middle-panel"
      ) as HTMLDivElement;

      if (
        middlePanel &&
        middlePanel.offsetHeight < scrollTop + 1.4 * offsetHeight
      ) {
        this.showTopicsFeeds();
      }
    }
  };

  toggleEditPanel = () => {
    const { showEditPanel } = this.state;
    this.setState({ showEditPanel: !showEditPanel });
  };

  render() {
    if (this.props.lifechain && this.props.lifechain.accountAddress) {
      const lifechain = this.props.lifechain;
      const cards = (
        <I18n>
          {t => (
            <div className="cards">
              {this.state.feeds.map((feedInfo, index) => (
                <FeedCard
                  key={index}
                  feedInfo={feedInfo}
                  lifechain={this.props.lifechain}
                />
              ))}
              <p id="feed-footer">
                {" "}
                {this.state.loading
                  ? this.state.msg
                  : t("general/No-more-feeds")}{" "}
              </p>
            </div>
          )}
        </I18n>
      );
      const profileCard = (
        <ProfileCard
          userInfo={this.state.userInfo}
          lifechain={this.props.lifechain}
        />
      );
      const followingsCard = <FollowingsCard lifechain={this.props.lifechain} />;
      const topicsCard = <TopicsCard lifechain={this.props.lifechain} />;
      const postBtnGroup = (
        <div className="post-btn-group">
          <div className="lifechain-btn btn" onClick={this.toggleEditPanel}>
            <i className="fas fa-pen-square" />LifeChain
          </div>
          <a href="https://github.com/oicu8/lifechain" target="_blank">
            <div className="github-btn btn">
              <i className="fab fa-github" />
            </div>
          </a>
          <a href="https://github.com/oicu8/lifechain/issues" target="_blank">
            <div className="bug-btn github-btn btn">
              <i className="fas fa-bug" />
            </div>
          </a>
          <a href="https://ethgasstation.info/" target="_blank">
            <div className="github-btn btn">
              <i className="fas fa-fire" />
            </div>
          </a>
        </div>
      );
      const topCard = <I18n>{t => <div className="top-card card" />}</I18n>;

      return (
        <div className="home topics-page">
          <Header lifechain={this.props.lifechain} page={Page.TopicsPage} />
          <div className="container">
            <MediaQuery query="(max-width: 1368px)">
              <div className="left-panel">
                {profileCard}
                {postBtnGroup}
                {followingsCard}
                {topicsCard}
              </div>
              <div className="middle-panel">
                {topCard}
                {cards}
              </div>
            </MediaQuery>
            <MediaQuery query="(min-width: 1368px)">
              <div className="left-panel">
                {profileCard}
                {followingsCard}
              </div>
              <div className="middle-panel">
                {topCard}
                {cards}
              </div>
              <div className="right-panel">
                {postBtnGroup}
                {topicsCard}
              </div>
            </MediaQuery>
            {this.state.showEditPanel ? (
              <Edit cancel={this.toggleEditPanel} lifechain={this.props.lifechain} />
            ) : null}
          </div>
        </div>
      );
    } else {
      return <Error />;
    }
  }
}
