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
            newEntry: newEntryFactory(),
            changelogEntries: [],
            completeChangelogLink: '#'
        },
        methods: {
            toggleCheckCommit: function(commit) {
                if (this.newEntry.commits.indexOf(commit) === -1) {
                    this.newEntry.commits.push(commit);
                }
                else {
                    this.newEntry.commits.splice(this.newEntry.commits.indexOf(commit), 1);
                }
            },
            addEntry: function() {
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
                var output = '';

                for (var i=0, l=this.changelogEntries.length; i<l; i++) {
                    const entry = this.changelogEntries[i];

                    output += ' - ' + entry.text + '  ';

                    if (entry.hashes.length > 0) {
                        for (var y=0, m=entry.hashes.length; y<m; y++) {
                            output += entry.hashes[y];

                            if (y < m-1) {
                                output += ', ';
                            }
                        }
                    }

                    output += '\n';
                }

                output += '\n[Complete changelog](' + this.completeChangelogLink + ')';

                return output;
            }
        }
    });

    const onSourceLoaded = function(source, url) {
        const github = $(source);

        vue.completeChangelogLink = url;

        github.find('.commit').each(function() {
            const commit = $(this),
                text = commit.find('.commit-message').text().trim();

            vue.commits.push({
                text: text,
                hash: commit.find('.commit-id').text().trim(),
                added: false,
                isMerge: text.indexOf('Merge pull request') === 0
            });
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
