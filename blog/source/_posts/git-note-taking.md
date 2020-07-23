---
layout: blog
title: Git Note Taking
date: 2020-07-22 22:32:32
tags:
  - git
  - notes
---

For the past five years I have been using physical notebooks to take notes. This was an easy way for me to jot notes during meetings and easily refer back to them. Also the act of writing contemporaneous notes helps me to remember topics. However physical notes have had several draw backs.

* No searchability
* Requires me to carry notebook with me, if I forgot it I'd have to write it and transfer it later
* Updates to existing notes weren't grouped together

The format of the notes typically looked like this:

```
Meeting or Topic                   [date]

Topic
-----

* information 1
* information 2
```

Since these were a pretty standard format and I carry a laptop to every meeting or due to COVID-19 mostly work remote I've started taking notes via Markdown and have them comitted to a private GitHub repository. This has the benefit of being able to be searched with `git grep`, no need to carry a notebook, I can update past notes if required. I can also refer to my notes remotely via GitHub's mobile interface from my phone if needed.

The format mostly stays the same, this is the directory structure for now:

```
➜  Notes git:(07/23/2020) tree
.
├── 2020
│   ├── 07-09-2020.md
│   ├── 07-10-2020.md
│   ├── 07-13-2020.md
│   ├── 07-14-2020.md
│   ├── 07-15-2020.md
│   ├── 07-16-2020.md
│   ├── 07-17-2020.md
│   ├── 07-21-2020.md
│   ├── 07-22-2020.md
│   └── 07-23-2020.md
└── README.md

1 directory, 11 files
```

You can see I create a new branch for each day and group notes via year. Naming is done via day, month, year. At the end of every day I create a PR, review it in GitHub and merge it to master. In the event of an emergency I can even make changes directly via GitHub's editor and commit right to master.

Over time I expect I will futher adapt the format and perhaps even create a standard pipeline to process the notes further.