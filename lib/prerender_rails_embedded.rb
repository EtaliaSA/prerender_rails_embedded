module PrerenderRailsEmbedded
  require 'timeout'
  require 'phantomjs'

  def self.flatten_js_to_html(url)
    out = ''
    thread = nil
    pid = -1
    begin
    Timeout::timeout(30) do
      thread = Thread.new do
        IO.popen(phantomjs_invocation(url)) do |io|
          pid = io.pid
          Rails.logger.debug("Spawing new phantomjs processo with pid: #{pid}")
          io.read
        end
      end
      out += thread.value
    end
    rescue Timeout::Error
      Rails.logger.debug('triggering timed out')

      if pid_exists?(pid)
        Rails.logger.warn("phantomjs with pid##{pid} timed out")

        Process.kill 9, pid
        out += '<html><head><meta name="robots" content="noindex, noarchive " /></head><body></body></html>'
      end
      if thread && thread.alive?
        Thread.kill(thread)
      end
    end
    out
  end


  def self.pid_exists?(pid)
    begin
      Process.kill 0, pid
      return true
    rescue Errno::ESRCH
      return false
    end

  end

  def self.phantomjs_invocation(url)
    [Phantomjs.path , '--load-images=false', '--ignore-ssl-errors=true', '--ssl-protocol=TLSv1', '--disk-cache=true', '--max-disk-cache-size=524228', "#{File.dirname(__FILE__)}/prerender_rails_embedded.js", url]
  end

  def self.local_renderer
    Proc.new do |env|
      flatten_js_to_html(Rack::Request.new(env).url)
    end
  end
end