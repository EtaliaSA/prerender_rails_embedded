Prerender Rails Embedded
========================
A rails gem to use [prerender_rails](https://github.com/prerender/prerender_rails) middleware
to render JavaScript web app calling phantomjs on the fly without installing other services.

### <a id='middleware'></a>
## Overview

With **Prerender Rails Embedded** can be avoided a new node.js server installation in a
rails environment because rails will launch a `phantomjs` binary to render the js page.

Just to try out the [prerender.io/server](https://prerender.io/server) technology
and for low traffic situation, this plugin is not meant to support heavy traffic loads.

### <a id='installation'></a>
## Installation

Add in your `Gemfile` a line with

```ruby
    gem 'prerender_rails_embedded'
```

and launch a

    bundle install

to install it. Then in the `config/environment/production.rb` it should be added:

```ruby
    config.middleware.use Rack::Prerender before_render: PrerenderRailsEmbedded.local_renderer
```

### <a id='test'></a>
### Test

To test the correct functioning of the `prerender_rails_embedded` gem just start rails
with `rails s` and launch a curl to a (js generated) url like this:

    curl -H "User-Agent: Mozilla/5.0 baiduspider" \
        "http://localhost:3000/articles/a0af82a84-d386-4690-9f68-81ac768bc6d3"

It should show a completely rendered page in standard output.

### Warning

**WEBrick** and **Thin** don't support multiple nested requests so, using them it will
hang the request until a timeout is issued by the web server. To test it out you should
consider using [unicorn](http://unicorn.bogomips.org/) with more than one worker thread.

Just add `gen unicorn` to your `Gemfile` launch `bundle install` create a `config/unicorn.rb`
file with content (adjusting it to your needs)

```ruby
    # config/unicorn.rb
    worker_processes 3
    timeout 30
    preload_app true

    before_fork do |server, worker|

      Signal.trap 'TERM' do
        puts 'Unicorn master intercepting TERM and sending myself QUIT instead'
        Process.kill 'QUIT', Process.pid
      end

      defined?(ActiveRecord::Base) and
        ActiveRecord::Base.connection.disconnect!
    end

    after_fork do |server, worker|

      Signal.trap 'TERM' do
        puts 'Unicorn worker intercepting TERM and doing nothing. Wait for master to sent QUIT'
      end

      defined?(ActiveRecord::Base) and
        ActiveRecord::Base.establish_connection
    end
```

and launch the web server with the command:

```shell
    bundle exec unicorn -p 3000 -c ./config/unicorn.rb
```

### <a id='todos'></a>
## TODOs

This has been a very quick development so there are

 * exceptions should exit immediately from phantomjs and in some cases they DON'T
 * add a timeout for too long phantojs processing
 * support 404 and error code in the same way prerender.io (server) does

### Future enhancements
 * add memory/disk cache deciding a correct eviction policy to avoid rendering pages
  multiple times.
