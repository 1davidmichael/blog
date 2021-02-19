---
title: Dotfile management with YADM
date: 2021-02-19 15:03:29
tags:
  - yadm
  - dotfiles
  - linux
---

For a long time I have neglected my `$HOME` dotfiles. At best I kept them saved in GitHub gist notes and occasionally updated them. At worst I kept them in my home dir and copied them from machine to machine, tweaking things as needed. Well the time for that has come to an end. I've committed to be better.

{% asset_img dotfiles.png Dotfiles! %}


Starting today I've begun using a popular dotfile management tool called [YADM (Yet Another Dotfiles Manager)](https://github.com/TheLocehiliosan/yadm). I've started simple, my nvim, zsh, tmux and note scripts are now commited to git. YADM is a pretty simple tool, if you have used git you will be right at home. In fact commands are basically the same.

## Getting Started

You can initialize a new repo using the yadm cli:

```bash
yadm init
```

From there adding files and committing them is the same as using git. Because I have started using main, instead of master as my default git branch I changed it to use that.


```bash
yadm add .zshrc
yadm commit -m "Adding .zshrc config file"
yadm branch -m main
yadm push origin master
```

## Next Steps

Right now I only have a few config files but I'd like to build on this to be able to provision any unix-type system I use regularly in a few short commands. Things I will be adding to this over time to setup.

* [YADM boostrap](https://yadm.io/docs/bootstrap#)
* [Encrypted files](https://yadm.io/docs/encryption)
* [Per OS included files](https://yadm.io/docs/alternates#)

Currently my dotfiles can all be found [in this repo](https://github.com/1davidmichael/dotfiles). I expect to be expanding this in the days to come as I test on various systems.
