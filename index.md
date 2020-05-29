{% for page in site.pages %}
    <ul>
      <li><a href="{{ page.url }}">{{ page.title }}</a></li>
    </ul>
{% endfor %}