# LifeChain

A decentralized social media built on the Ethereum Ropsten network.

## Overview

#### Description

Eth Based Social Platform

#### Abstract/Summary
Web 3.0 and ETH Blockchain link -: https://github.com/oicu8/lifechain.git
## Screenshots

![Home Page of the App]("")
![More Images of the App]("")
![Interface where posts are displayed]("")

## Make a post

To make post, click the green `LifeChain` button.

Posts in lifechain are written in Markdown.
There are two types of posts now:

* Normal post

for example:

```markdown
This is a normal post written in [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).
```

* Article post

for example:

```markdown
![](image.jpg)

# Article title

my content goes here
```

### Post to topic

You can make a post to a topic by writing `#{topic}`.  
For example:

```markdown
Hello #{world} will post this to `world` topic
```

### Mention a user

You can mention a person in your post by writing `@{username}`.  
For example:

```markdown
Hi @{lifechain} will notify the user `lifechain` this about post.
```

### Embed videos

For example:

```markdown
@[mp4](https://www.w3schools.com/html/mov\_bbb.mp4)
@[ogg](https://www.w3schools.com/html/mov\_bbb.ogg)
@[youtube](ZE2HxTmxfrI)
@[vimeo](269637018)
@[vine](5AZm7bleEj5)
@[bilibili](aid=23642605)
```
## What will be saved to blockchain and what will not

Will be on blockchain:
* Your profile information like your username, bio, avatar url, and cover url.
* Your posts written in markdown.

Will not be on blockchain:
* Your media files written in your markdown post, such as images, videos, etc...
* Your followings, faviorite topics, setttings will be saved locally in your browser.
## Run Locally

Clone the project

```bash
  git clone https://github.com/oicu8/lifechain
```

Go to the project directory

```bash
  cd lifechain
```

Install the Dependencies

```bash
  yarn
```

Start The Deployment

```bash
  yarn serve
```


## Deployment

To deploy this project run

```bash
  yarn build
```


## Usage/Examples

## Usage

1.  Install [MetaMask](https://metamask.io/) in your Chrome browser and launch it. Follow the MetaMask instructions and create an account.
2.  Switch to `Ropsten Test Network`. Visit the faucet website listed below and request test ethers. Don't worry, they are fake ether coins.
	* http://faucet.ropsten.be:3001/ and click `request 1 ether from faucet`.
	* https://faucet.metamask.io/ and click `Send me 1 test ether!`
3.  Once you have deployed the app through yarn and gone to the localhost via your browser,
it will ask you to finish a signup. Simply finish the form and then click `Publish profile to blockchain` button to create your account.
Wait for a few minutes until the transaction finishes, then REFRESH the page.


## Contributing

Contributions are always welcome!

Make a pull request to get started.

Please adhere to this project's `code of conduct`.


## FAQ

#### Is this social network built on the ethereum mainnet?

Answer - No, this project is right now in a experiment stage and is deployed on the ropsten network, this is not deployed on the mainnet yet.

#### Can we earn real money from this social media ?

Answer - As of now the tokens on the faucets are given in the ropsten test network, so you can't earn real money from the same.
