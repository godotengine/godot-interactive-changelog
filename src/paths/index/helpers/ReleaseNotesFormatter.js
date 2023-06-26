// This list is ordered from less general (and more likely to be used) to more general (and less likely to be used).
const GENERAL_TOPICS = [
    "buildsystem", "porting", "tests", "thirdparty", "2d", "3d", "editor", "codestyle", "core"
];

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

        // Some PR titles contain the same group prefix already,
        // so we're going to remove it for a cleaner look.
        if (cleanMessage.startsWith(`${groupName}:`)) {
            cleanMessage = cleanMessage.substring(groupName.length + 1).trim();
        }

        return cleanMessage;
    }

    static sortGroupNames(a, b) {
        if (a.toLowerCase() > b.toLowerCase()) return 1;
        if (a.toLowerCase() < b.toLowerCase()) return -1;
        return 0;
    }
}
