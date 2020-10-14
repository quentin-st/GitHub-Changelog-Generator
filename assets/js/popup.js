/**
 * GitHub changelog generator
 */

$(function() {

    const newEntryFactory = function() {
        return {
            text: '',
            commits: []
        };
    };

    const vue = new Vue({
        el: '#app',
        data: {
            commits: [],
            contributors: {},
            newEntry: newEntryFactory(),
            changelogEntries: [],
            completeChangelogLink: '#',
            commitsCount: 0,
            filesChanged: 0,
            additions: 0,
            deletions: 0
        },
        methods: {
            toggleCheckCommit: function(commit) {
                // Add/remove commit from commits list
                if (this.newEntry.commits.indexOf(commit) === -1) {
                    this.newEntry.commits.push(commit);

                    if (!this.newEntry.text.length) {
                        this.newEntry.text = commit.text;
                    }
                }
                else {
                    this.newEntry.commits.splice(this.newEntry.commits.indexOf(commit), 1);
                }
            },
            addEntry: function() {
                if (this.newEntry.text.length === 0) {
                    return;
                }

                var hashes = [];

                for (var i=0, l=this.newEntry.commits.length; i<l; i++) {
                    const commit = this.newEntry.commits[i];
                    commit.added = true;
                    hashes.push(commit.hash);
                }

                this.changelogEntries.push({
                    text: this.newEntry.text,
                    hashes: hashes
                });
                this.newEntry = newEntryFactory();
            }
        },
        computed: {
            output: function() {
                const rows = [
                    '**Changelog**'
                ];

                if (this.changelogEntries.length === 0) {
                    rows.push(
                        ` - *This changelog is empty. Please take a look at the [complete changelog](${this.completeChangelogLink}).*`
                    );
                }
                else {
                    for (var i = 0, l = this.changelogEntries.length; i < l; i++) {
                        const entry = this.changelogEntries[i];
                        var commitRow = ` - ${entry.text}  `;

                        if (entry.hashes.length > 0) {
                            for (var y = 0, m = entry.hashes.length; y < m; y++) {
                                commitRow += entry.hashes[y];

                                if (y < m - 1) {
                                    commitRow += ', ';
                                }
                            }
                        }

                        rows.push(commitRow);
                    }
                }

                rows.push(
                    '',
                    `[Complete changelog](${this.completeChangelogLink})`,
                    '',
                    '**Stats**',
                    '```diff',
                    `${this.commitsCount} commits`,
                    `${this.filesChanged} files changed`,
                    `+${this.additions} additions`,
                    `-${this.deletions} deletions`,
                    '```',
                    '',
                    '**Contributors**:'
                );

                for (var z=0, l2=Object.keys(this.contributors).length; z<l2; z++) {
                    const contributorName = Object.keys(this.contributors)[z],
                        commitsCount = this.contributors[contributorName].commitsCount;

                    rows.push(` - ${contributorName} - ${commitsCount} commit${commitsCount != 1 ? 's' : ''}`);
                }

                return rows.join('\n');
            }
        }
    });

    const onSourceLoaded = function(source, url) {
        const github = $(source);

        window.github = github;
        if (github.find('.octicon').length === 0) {
            $('#app').html('<div class="text-muted huge">You\'re not on GitHub!</div>');
            return;
        }

        vue.completeChangelogLink = url;
        vue.commitsCount = github.find('#commits_tab_counter').text().trim();
        vue.filesChanged = github.find('#files_tab_counter').text().trim();
        vue.additions = github.find('#diffstat').find('.text-green').text().trim().substr(1);
        vue.deletions = github.find('#diffstat').find('.text-red').text().trim().substr(1);

        // Commits
        github.find('.js-commit').each(function() {
            const commit = $(this),
                userAvatar = commit.find('.avatar').find('img').attr('src'),
                userName = commit.find('.avatar').find('img').attr('alt');

            const [textEl, hashEl] = commit.find('a[href*="/commits/"]');
            const text = $(textEl).text().trim(),
                hash = $(hashEl).text().trim();

            // Don't include merge commits
            if (text.indexOf('Merge pull request') === 0 || text.indexOf('Merge branch') === 0) {
                return;
            }

            vue.commits.push({
                text: text,
                hash: hash,
                added: false,
                userAvatar: userAvatar,
                userName: userName
            });
        });

        // Contributors
        github.find('.js-commit').each(function() {
            const commit = $(this),
                contributor = commit.find('.avatar').find('img').attr('alt');

            if (Object.keys(vue.contributors).indexOf(contributor) === -1) {
                vue.contributors[contributor] = {
                    name: contributor,
                    commitsCount: 0
                };
            }

            vue.contributors[contributor].commitsCount++;
        });
    };

    // Don't look down there.
    chrome.runtime.onMessage.addListener(function(request, sender) {
        if (request.action === 'getSource') {
            onSourceLoaded(request.source, request.url);
        }
    });

    chrome.tabs.executeScript(null, {
        file: "assets/js/trojan.js"
    }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        }
    });
});
