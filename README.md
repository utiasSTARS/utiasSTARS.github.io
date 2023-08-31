# STARS Lab Paper Web Repository

A place to create web pages for papers published by the STARS lab.

## Instructions for authors

1. Clone this repo.

2. Create a markdown file in the `_pages` directory (see `bingham-rotation-learning.md` for an example).

3. To have papers arranged in ascending chronological order in the navigation, add a ```nav_order: XXXX``` tag to your page's front matter where ```XXXX``` is an integer lower than the one associated with the paper at the top of the list.

4. [Optional] If you need to host images, add them to a custom folder in the `assets` directory and link to them in your markdown.

5. [Optional] Use the lovely [UI components](https://just-the-docs.github.io/just-the-docs/docs/ui-components) provided by our theme [Just the Docs](https://github.com/just-the-docs/just-the-docs).

6. [Optional] If you dont want your page to appear in the navigation area, add the ```nav_exclude: true``` tag to your page's front matter.

7. Preview your changes locally by setting up `jekyll` and `github-pages` and then running `bundle exec jekyll serve` (see [here](https://help.github.com/en/enterprise/2.14/user/articles/setting-up-your-github-pages-site-locally-with-jekyll#step-2-install-jekyll-using-bundler) for more info).

8. When happy with your page, push back to this repo (everything should be compiled automagically).

## Documented errors / issues

### jekyll-include-cache ([source](https://iamfullstack.tistory.com/12))

After running `bundle exec jekyll serve` , you get an issue similar to this:

```txt
Dependency Error: Yikes! It looks like you don't have jekyll-include-cache or one of its dependencies installed.
```

Install the `jekyll-include-cache` gem:

```sh
sudo gem install jekyll-include-cache
```

Then add `gem 'jekyll-include-cache'` to the Gemfile.
