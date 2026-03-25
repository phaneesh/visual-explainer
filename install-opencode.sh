#!/bin/bash
# install-opencode.sh - Install visual-explainer for OpenCode

set -e

SKILL_DIR="$HOME/.config/opencode/skills/visual-explainer"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"

# Check if we're in the repo or need to clone
if [ ! -f "plugins/visual-explainer/SKILL.md" ]; then
    echo "Cloning visual-explainer..."
    TEMP_DIR=$(mktemp -d)
    git clone --depth 1 https://github.com/nicobailon/visual-explainer.git "$TEMP_DIR"
    cd "$TEMP_DIR"
    CLEANUP=true
else
    CLEANUP=false
fi

# Copy skill
echo "Installing skill to $SKILL_DIR..."
mkdir -p "$(dirname "$SKILL_DIR")"
rm -rf "$SKILL_DIR"
cp -r plugins/visual-explainer "$SKILL_DIR"

# Replace {{skill_dir}} with actual path
echo "Patching paths..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    find "$SKILL_DIR" -name "*.md" -exec sed -i '' "s|{{skill_dir}}|$SKILL_DIR|g" {} \;
else
    find "$SKILL_DIR" -name "*.md" -exec sed -i "s|{{skill_dir}}|$SKILL_DIR|g" {} \;
fi

# Cleanup if we cloned
if [ "$CLEANUP" = true ]; then
    rm -rf "$TEMP_DIR"
fi

echo ""
echo "Done! visual-explainer skill installed to $SKILL_DIR"
echo ""
echo "Next: enable the opencode-agent-skills plugin in your OpenCode config."
echo ""

# Check if opencode.json already has the plugin entry
if [ -f "$OPENCODE_CONFIG" ]; then
    if grep -q "opencode-agent-skills" "$OPENCODE_CONFIG"; then
        echo "  opencode-agent-skills is already present in $OPENCODE_CONFIG"
    else
        echo "  Add the following to $OPENCODE_CONFIG:"
        echo ""
        echo '    "plugin": ["opencode-agent-skills"]'
        echo ""
        echo "  Then restart OpenCode."
    fi
else
    echo "  Create $OPENCODE_CONFIG with:"
    echo ""
    echo '    {'
    echo '      "plugin": ["opencode-agent-skills"]'
    echo '    }'
    echo ""
    echo "  Then start OpenCode."
fi

echo ""
echo "Once installed, ask the agent to use visual-explainer, or use commands like:"
echo "  generate-web-diagram, diff-review, plan-review, project-recap"
echo "  generate-slides, generate-visual-plan, fact-check, share"
