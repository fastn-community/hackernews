const loadingTemplate = document.createElement('template');

loadingTemplate.innerHTML = `
    <div class="loading">
        Loading...
    </div>
`;

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

function getRelativeTimeString(timestamp, lang = navigator.language) {
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  const deltaSeconds = currentTimeInSeconds - timestamp;
  const absoluteDelta = Math.abs(deltaSeconds);

  const times = [
    [MINUTE, "second", 1],
    [HOUR, "minute", MINUTE],
    [DAY, "hour", HOUR],
    [WEEK, "day", DAY],
    [MONTH, "week", WEEK],
    [YEAR, "month", MONTH],
    [Infinity, "year", YEAR],
  ];

  let divider = YEAR;
  let timeType = "year";

  for (const [interval, type, divisor] of times) {
    if (absoluteDelta < interval) {
      divider = divisor;
      timeType = type;
      break;
    }
  }

  const rtf = new Intl.RelativeTimeFormat(lang, {
    numeric: "auto",
  });

  const relativeValue = Math.floor(deltaSeconds / divider);
  return rtf.format(relativeValue, timeType);
}

const hnStyles = new CSSStyleSheet();

const hnStylesCss = `
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:host {
    display: block;
    font-family: sans-serif;
    width: 100%!important;
    --primary-color: #F56565;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
}

.posts {
    display: flex;
    flex-direction: column;
    margin: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,.05);
    border-radius: .5rem;
    overflow: hidden;
}

.post {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.post-header {
    display: flex;
    gap: .5rem;
}

.post-header__title {
    font-size: 1.1rem;
    font-weight: 500;
}

.post-stats {
    font-size: .9rem;
}
`;

hnStyles.replaceSync(hnStylesCss);

class HackerNewsPosts extends HTMLElement {
    constructor() {
        super();

        let data = window.ftd.component_data(this);

        // Create a shadow root
        this.attachShadow({mode: 'open'});

        this.shadowRoot.adoptedStyleSheets = [hnStyles];

        this.ids = fastn_utils.getFlattenStaticValue(data.ids.get());

        this.renderLoading();
        this.loadPostsAndRender();
    }

    async loadPostsAndRender() {
        this.posts = await Promise.all(this.ids.map(async id => {
            const postRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return await postRes.json();
        }));

        this.renderPosts();
    }

    async renderPosts() {
        const template = document.createElement('template');
        template.innerHTML = `
            <div class="posts">
            ${
                this.posts.map(({ title, url, score, by, time }) => {
                    const { hostname } = new URL(url);
                    
                    return `
                        <div class="post">
                            <div class="post-header">
                                <h2 class="post-header__title">${title}</h2>
                                <a href="${url}" class="post-header__url">${hostname}</a>
                            </div>
                            <div class="post-stats">
                                ${score} pts by ${by} ${getRelativeTimeString(time)}
                            </div>
                        </div>
                    `;
                }).join('\n')
            }
            </div>
        `;
        this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }

    renderLoading() {
        this.shadowRoot.appendChild(loadingTemplate.content.cloneNode(true));
    }
}

customElements.define('hn-posts', HackerNewsPosts);
