module PrerenderRailsEmbedded
  require 'phantomjs'

  def self.flatten_js_to_html(url)
    Phantomjs.run("#{File.dirname(__FILE__)}/prerender_rails_embedded.js", url, '--load-images=false', '--ignore-ssl-errors=true', '--ssl-protocol=tlsv1', '--disk-cache=yes', '--max-disk-cache-size=524228')
  end

  def self.local_renderer
    Proc.new do |env|
      flatten_js_to_html(Rack::Request.new(env).url)
    end
  end
end