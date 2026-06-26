# Patch FeedHomeScreen.tsx to add "meat" case
# Run this in terminal:

sed -i '' 's/case "myFeed":/case "myFeed":/' src/screens/feed/FeedHomeScreen.tsx
sed -i '' 's/return <MyFeedTabContent navigation={navigation} \/>;/return <MyFeedTabContent navigation={navigation} \/>;
      case "meat":
        return <MeatTabContent \/>;/' src/screens/feed/FeedHomeScreen.tsx
