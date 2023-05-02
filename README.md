# proca-digest
Send digests to the targets

We have learnt the hard way, it is way less painful to have a two (or 3) steps process:

1. (in proca) node bin/digest.js take the mjml files and make one html template per language
2. prepare.js takes the list of targets and the html templates and create the email
3. send.js take the prepared emails and send them.

separating the steps between 2. and 3. allow some QA, makes it easy to schedule... trust me, you need separate steps

## config

cp .env.example to .env and adjust the folder

the config folder should map the one you hopefully have already on proca (widget)  with the config containing (at least)
- config/campaign/xxx.json
- config/target/source/xxx.json

## preview

the preview relies on etheral.email or on mailhog

if you haven't installed mailhog (a local test smtp server)yet:

    sudo apt-get -y install golang-go
    go install github.com/mailhog/MailHog@latest

Then, start MailHog by running 

    ~/go/bin//path/to/MailHog

