tell application "System Events"
  tell process "Simulator"
    set w to window "iPhone 17 Pro – iOS 26.5"
    set g2 to group 2 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of w
    return UI elements of g2
  end tell
end tell
