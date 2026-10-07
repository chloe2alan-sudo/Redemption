# Tawk.to Live Chat

The previous placeholder/configurable live-chat block has been removed from the public HTML pages.

Your supplied Tawk.to widget is now the only Tawk widget installed:

Property/Widget:
6ac5b250cc4acf34c88114ab/1k4a41367

Installed on:
- public/index.html
- public/blog.html
- public/article.html

After replacing the deployed files, rebuild/restart the container:

docker compose up -d --build

If an old chat button still appears after deployment, clear the browser cache or test in a private/incognito window. Also make sure the old deployed container/site files have actually been replaced.
