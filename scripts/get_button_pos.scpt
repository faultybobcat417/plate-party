tell application "System Events"
  tell process "Simulator"
    set w to window "iPhone 17 Pro – iOS 26.5"
    set g2 to group 2 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of group 1 of w
    set sa to scroll area 1 of g2
    set g1 to group 1 of sa
    set btn to button 1 of g1
    return {position of btn, size of btn}
  end tell
end tell
