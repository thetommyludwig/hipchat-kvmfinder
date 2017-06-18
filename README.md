Hipchat plugin built to interface with previous datacenter's portal to update KVM locations.


Hipchat's Vagrant file readme:
# What is this?

This is a basic project that demonstrates how to quickly get started developing a HipChat integration using [ac-koa-hipchat](https://bitbucket.org/atlassianlabs/ac-koa-hipchat).

It uses a basic [Vagrant](https://www.vagrantup.com) configuration to provide one option for quickly getting started with a basic setup using the following dependencies:

* Node.js 0.12.x
* Redis
* MongoDB
* ngrok
* nodemon
* a simple example addon

# How do I use it?

Make sure that you have both [Vagrant](https://www.vagrantup.com/downloads.html) and [VirtualBox](https://www.virtualbox.org/wiki/Downloads) installed, then start by cloning this project from git:

```
#!bash
git clone https://bitbucket.org/atlassianlabs/ac-koa-hipchat-vagrant my-addon
```

Edit the `package.json` file and give your project unique name and author fields, at least.  We also generate a random add-on key for use while running in the Vagrant VM (to avoid collisions with other developers while installing your add-on at hipchat.com), though you'll want to make sure you set an appropriate, unique key here if you deploy your project to production.

These are the most important fields to configure now:

```
#!json
{
  "name": "my-addon-key",
  "displayName": "My Add-on Name",
  "description": "You add-on description",
  "author": {
    "name": "My Name",
    "url": "http://mycompany.com"
  }
}
```

When that's done, run the following commands:

```
#!bash

> cd /path/to/my-addon
> vagrant up
# several minutes later....
> vagrant ssh
# ...
Last login: Tue Sep  9 06:53:21 2014 from 10.0.2.2

Tunnel established at https://xxxxxxxx.ngrok.com

Run 'cd project && npm run web-dev' to start your add-on.

$ cd project && npm run web-dev
# ...
info: Atlassian Connect add-on started at https://xxxxxxxx.ngrok.com
```

You should now have an installable HipChat integration running at some unique url, like `https://xxxxxxxx.ngrok.com`, where the `xxxxxxxx` value will be a unique id for your server.

The `project` directory in /home/vagrant in the guest VM is a share that mounts the cloned git repository on your host OS.  You can do your development either in the VM or, more likely, using your favorite editor or IDE running in the host OS.

Now, to install the add-on at hipchat.com, see the [ac-koa instructions](https://bitbucket.org/atlassianlabs/ac-koa-hipchat/wiki/Getting_Started#markdown-header-manually-installing-the-add-on-using-hipchats-admin-ui), starting with the section titled "Manually installing the add-on using HipChat's admin UI".  The remainder of that document will also be useful for learning how to modify the starter add-on included with this project.

# How do I write an add-on?

This repository helps you get started writing an add-on with ac-koa-hipchat. For reference on how to use ac-koa, please refer to the [README](https://bitbucket.org/atlassianlabs/ac-koa-hipchat).
