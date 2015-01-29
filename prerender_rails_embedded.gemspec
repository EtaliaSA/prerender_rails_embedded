# coding: utf-8

Gem::Specification.new do |spec|
  spec.name          = 'prerender_rails_embedded'
  spec.version       = '0.2.9'
  spec.authors       = ['Gian Carlo Pace', 'Luca Mirra']
  spec.email         = %w(giancarlo.pace@etalia.net)
  spec.description   = %q{A plugin for prerender_rails middleware to render JavaScript web app on the fly calling phantomjs directly}
  spec.summary       = %q{Prerender your backbone/angular/javascript rendered application on the fly when search engines crawl}
  spec.homepage      = 'https://github.com/EtaliaSA/prerender_rails_embedded'
  spec.license       = 'Apache License 2.0'

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = %w(lib)

  spec.add_development_dependency 'bundler', '~> 1.3'
  spec.add_development_dependency 'rake'
end
