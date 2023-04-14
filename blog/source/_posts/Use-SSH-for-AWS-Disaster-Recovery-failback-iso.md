---
title: Use SSH for AWS Disaster Recovery failback iso
date: 2023-04-14 12:40:42
tags:
- aws
- disaster-recovery
- failback
- ssh
- linux
---

If you are using AWS Disaster Recovery to failover to AWS you may eventually need to failback to your on-premises environment. In testing with a virtualized home lab running Proxmox I ran into an annoying issue.

The process for failback is this:

1. Failover to AWS, have to do this before you can failback
1. Download ISO from AWS and attach to VM (or boot physical server from it)
1. Once the ISO boots it prompts you for a region, access and secret key to setup the failback process

The issue I ran into is typing the region, access and secret key into the Proxmox console is a pain and I was typoing it. Here is the solution I came up with to help solve this:

## Enable SSH

Within the booted ISO you can use the `Ctrl+c` command to quit the installer and be dropped into a Linux shell, within there you can modify the SSH configs to allow SSH on all network devices:

```bash
# Edit SSH config
vim /etc/ssh/sshd_config

# Then change the following line:
# ListenAddress 127.0.0.1
# To this:
# ListenAddress 0.0.0.0

# Then restart SSH
sudo systemctl restart sshd
```

## Run Replication Executable over SSH

Now that SSH is enabled you can run the replication executable over SSH to setup the failback process:

```bash
sudo ./failback_entry
```

Now it should prompt you for your region, access and secret key and you can paste them in without having to worry about typos.

One thing to note is that the `failback_entry` executable supports multiple flags, so you can pass in region, secret and access key via the CLI as well.

```bash
sudo ./failback_entry \
  --region us-east-1 \
  --aws-access-key-id AKIA... \
  --aws-secret-access-key ${SECRET_KEY}
```
