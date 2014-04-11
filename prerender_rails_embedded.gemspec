# coding: utf-8

Gem::Specification.new do |spec|
  spec.name          = "prerender_rails_embedded"
  spec.version       = "0.1"
  spec.authors       = ["Gian Carlo Pace"]
  spec.email         = ["giancarlo.pace@gmail.com"]
  spec.description   = %q{A plugin for prerender Rails middleware to render JavaScript web app on the fly calling phantomjs directly}
  spec.summary       = %q{Prerender your backbone/angular/javascript rendered application on the fly when search engines crawl}
  spec.homepage      = "https://github.com/prerender/prerender_rails_embedded"
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_dependency 'rack', '>= 0'

  spec.add_development_dependency "bundler", "~> 1.3"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "webmock"
end
