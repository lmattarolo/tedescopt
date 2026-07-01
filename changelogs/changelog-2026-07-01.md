# Changelog - 2026-07-01

## 🌟 New Features
- **Mnemonic Gender Stories**: Introduced a brand new feature to help memorize German noun genders. Nouns are grouped and contextualized in bizarre, action-packed stories starring specific characters:
  - **Superman** for masculine nouns (`der` - Blue)
  - **Regina** for feminine nouns (`die` - Pink)
  - **Bambino** for neuter nouns (`das` - Green)
- **Stories Tab (`StoriesView.jsx`)**: Added a new main navigation tab to browse, search, and infinitely scroll through all available stories.
- **Smart Story Highlighting (`StoryCard.jsx`)**: Automatically color-codes target nouns within the story text according to their gender for visual reinforcement.
- **Contextual Review Support (`App.jsx`)**: When completing a study session, any incorrectly answered nouns will now display a "Mostra Storia" (Show Story) button linking directly to the mnemonic story that contextualizes the word.

## 💾 Data & Backend
- **Einheit 1 Stories**: Fully populated `zanichelli_vocabulary/einheit_1.json` with 5 vivid stories that successfully cover every single gendered noun in the unit (44 nouns total).
- **Database Upgrades (`utils/db.js`)**: Upgraded `importUnit` logic to cleanly merge story updates, and updated `exportBackup`/`importBackup` to persist story data across devices.

## 🧪 Testing
- **UI Tests (`UI.test.jsx`)**: Added end-to-end component tests verifying the session completion logic, wrong-answer summary rendering, and the Stories tab search filter.
- **Data Validation (`unitData.test.js`)**: Added a strict unit test that ensures 100% of nouns with a defined gender in `einheit_1.json` are present in at least one story.
- **Database Tests (`db.test.js`)**: Added test coverage for story initialization, merging upon import, and backup serialization.
