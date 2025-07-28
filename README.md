# fantsubot

Discord bot for signing up for [Fantasiapelit.fi](http://fantasiapelit.fi) Magic the Gathering games.

For now in Finnish only, and middleware is fetching the games only for Jyväskylä shop.

Using Mailgun to send the email to Fantasiapelit.

## Development

1. Clone this repo
2. `yarn`
3. Copy `.sample-env` as `.env` & replace variables as you wish
4. Run `yarn start`

## Deployment

`yarn start:prod`
