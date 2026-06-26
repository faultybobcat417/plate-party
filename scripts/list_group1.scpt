tell application "System Events"
  tell process "Simulator"
    set w to window "iPhone 17 Pro – iOS 26.5"
    set g2 to group 2 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of w
    set content to group 1 of g2
    return UI elements of content
  end tell
end tell
