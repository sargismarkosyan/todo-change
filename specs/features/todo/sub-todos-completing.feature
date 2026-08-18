@feature:todo-sub-todos-completing
Feature: A parent todo and its sub-todos agree

  A todo with sub-todos is done exactly when every one of them is done. The two
  are never allowed to disagree on screen, whichever of them was ticked — a
  parent with a line through it while a step under it is still open would make
  the list lie at a glance, and the glance is the whole point.

  A todo with no sub-todos is unaffected by any of this.

  Background:
    Given the app is open
    And the list reads:
      | Sort out car insurance |
    And "Sort out car insurance" has the sub-todos:
      | Call current insurer |
      | Compare two quotes   |

  @rule:parent-done-when-all-sub-todos-done
  Rule: Ticking the last unfinished sub-todo marks the parent done

    Example: finishing the second of two
      When I tick "Call current insurer"
      Then "Sort out car insurance" is shown as unfinished
      When I tick "Compare two quotes"
      Then "Sort out car insurance" is shown as done

  @rule:parent-reopens-when-a-sub-todo-is-unticked
  Rule: Unticking a sub-todo makes the parent unfinished again

    Example: changing my mind about one step
      Given I tick "Call current insurer"
      And I tick "Compare two quotes"
      When I untick "Call current insurer"
      Then "Sort out car insurance" is shown as unfinished

  @rule:ticking-parent-ticks-sub-todos
  Rule: Ticking a parent ticks everything under it, and unticking clears them

    Example: the whole thing turned out to be done
      When I tick "Sort out car insurance"
      Then "Call current insurer" is shown as done
      And "Compare two quotes" is shown as done

    Example: unticking the parent reopens its sub-todos
      Given I tick "Sort out car insurance"
      When I untick "Sort out car insurance"
      Then "Call current insurer" is shown as unfinished
      And "Compare two quotes" is shown as unfinished

  @rule:new-sub-todo-reopens-parent
  Rule: Adding a sub-todo to a done parent makes it unfinished

    Example: one more step turns up
      Given I tick "Sort out car insurance"
      When I add "Cancel the old policy" under "Sort out car insurance"
      Then "Sort out car insurance" is shown as unfinished
      And "Call current insurer" is shown as done

  @rule:deleting-sub-todos-settles-the-parent
  Rule: Deleting sub-todos leaves the parent agreeing with what is left

    Example: deleting the only step that was still open
      Given I tick "Call current insurer"
      When I delete "Compare two quotes"
      Then "Sort out car insurance" is shown as done

    Example: losing the last sub-todo leaves an ordinary todo
      When I delete "Call current insurer"
      And I delete "Compare two quotes"
      Then "Sort out car insurance" has no sub-todos
      And "Sort out car insurance" is shown as unfinished
