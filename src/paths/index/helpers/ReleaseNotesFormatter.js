// This list is ordered from less general (and more likely to be used) to more general (and less likely to be used).
const GENERAL_TOPICS = [
    "buildsystem", "porting", "tests", "thirdparty", "2d", "3d", "editor", "codestyle", "core"
];

const VERSION_PREFIX_REGEX = /^[\(\[][34]\.[0-9x][\)\]]/;
const VERSION_SUFFIX_REGEX = /[\(\[][34]\.[0-9x][\)\]]$/;
const AREA_PREFIX_REGEX = /^[\[`']([a-zA-Z0-9]+)[\]`']/;

export default class ReleaseNotesFormatter {
    static determineGroup(allLabels) {
        // We use labels to deduce which category does the change
        // fall under. We consider more specific groups before more
        // general ones. When in doubt, pick any group.
        let groupName = "core";

        // Extract all applied topical labels.
        let topicLabels = allLabels
            .filter((item) => {
                return item.startsWith("topic:");
            })
            .map((item) => {
                return item.substring(6);
            });

        // Find the first topical label which is not generic, and
        // use it.
        const firstLabel = topicLabels.find((item) => {
            return GENERAL_TOPICS.indexOf(item) < 0;
        });

        if (firstLabel) {
            groupName = firstLabel;
        } else {
            // If there is none, pick a general topic, in order of relevance.
            let topicFound = false;
            for (let name of GENERAL_TOPICS) {
                if (topicLabels.indexOf(name) >= 0) {
                    groupName = name;
                    topicFound = true;
                    break;
                }
            }

            // Besides topical labels, we can also check some other ones.
            if (!topicFound) {
                if (allLabels.indexOf("documentation") >= 0) {
                    groupName = "documentation";
                }
                else if (allLabels.indexOf("usability") >= 0) {
                    groupName = "editor";
                }
            }
        }

        // If no group was detected, we just stay on "core".

        return groupName;
    }

    static humanizeGroupName(name) {
        switch (name) {
            case "2d":
                return "2D";
            case "3d":
                return "3D";
            case "dotnet":
                return "C#";
            case "gdextension":
                return "GDExtension";
            case "gdscript":
                return "GDScript";
            case "gui":
                return "GUI";
            case "visualscript":
                return "VisualScript";
            case "xr":
                return "XR";
        }

        return name.charAt(0).toUpperCase() + name.substring(1);
    }

    static cleanupChangeMessage(groupName, message) {
        let cleanMessage = message.trim();
        // Sometimes there are periods at the end.
        if (cleanMessage.endsWith(".")) {
            cleanMessage = cleanMessage.substring(0, cleanMessage.length - 1);
        }

        // Backports and cherry-picks sometimes have a version number/mask as
        // a prefix or suffix. We need to strip it.
        if (VERSION_PREFIX_REGEX.test(cleanMessage)) {
            // The size is fixed for all variations.
            cleanMessage = cleanMessage.substring(5).trim();
        }
        if (VERSION_SUFFIX_REGEX.test(cleanMessage)) {
            // The size is fixed for all variations.
            cleanMessage = cleanMessage.substring(0, cleanMessage.length - 5).trim();
        }

        // Prefixes come in two forms, "[Prefix]" and "Prefix:". We prefer the
        // second form, as it matches our manual style. So we convert the first
        // form into the second.
        let matched = cleanMessage.match(AREA_PREFIX_REGEX);
        if (matched != null) {
            let matchedString = matched[0];
            let matchedPrefix = matched[1]

            cleanMessage = cleanMessage.substring(matchedString.length + 1).trim();
            cleanMessage = `${matchedPrefix}: ${cleanMessage}`;
        }

        // Some PR titles contain the same group prefix already,
        // so we're going to remove it for a cleaner look.
        if (cleanMessage.startsWith(`${groupName}:`)) {
            cleanMessage = cleanMessage.substring(groupName.length + 1).trim();
        }

        // There are also some special cases where the prefix may
        // be slightly different than the group name.
        if (cleanMessage.startsWith("MP:")) {
            cleanMessage = cleanMessage.substring(3).trim();
        }
        if (cleanMessage.startsWith("doc:")) {
            cleanMessage = cleanMessage.substring(4).trim();
        }

        // Repeat some steps in case other transformations changed the content.

        // Sometimes there are periods at the end.
        if (cleanMessage.endsWith(".")) {
            cleanMessage = cleanMessage.substring(0, cleanMessage.length - 1);
        }

        return cleanMessage;
    }

    static sortGroupNames(a, b) {
        if (a.toLowerCase() > b.toLowerCase()) return 1;
        if (a.toLowerCase() < b.toLowerCase()) return -1;
        return 0;
    }
}
