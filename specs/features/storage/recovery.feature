@feature:storage-recovery
Feature: Surviving bad stored data

  localStorage is editable by anyone with devtools and shared with every other
  tab. The app must open on a usable screen no matter what it finds there.

  The examples naming "todo-change.todos" are the migration read — a list saved
  before notepads existed is untrusted in exactly the same way as one saved
  after, and it lands in a notepad called "My list" either way.

  @rule:recover-from-missing-key
  Rule: A browser with nothing stored starts on one empty notepad

    Example: a browser that has never opened the app
      Given "todo-change.notepads" is not set
      And "todo-change.todos" is not set
      When I open the app
      Then the open notepad is named "My list"
      And the list is empty
      And I see the message "Nothing to do yet."

  @rule:recover-from-unreadable-data
  Rule: Unreadable stored data does not break the app

    Example: the value is not valid JSON
      Given "todo-change.todos" holds "{not json"
      When I open the app
      Then the list is empty

    Example: the value is JSON but the wrong shape
      Given "todo-change.todos" holds "{\"todos\":\"nope\"}"
      When I open the app
      Then the list is empty

    Example: one entry in the array is not a todo
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Buy milk", "done": false} |
        | {"nonsense": true}                             |
      When I open the app
      Then the list reads:
        | Buy milk |

  @rule:recover-from-bad-sub-todos
  Rule: Broken nesting still opens a usable list

    Example: subTodos holds something that is not a list
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Buy milk", "done": false, "subTodos": "nope"} |
      When I open the app
      Then the list reads:
        | Buy milk |
      And "Buy milk" has no sub-todos

    Example: one sub-todo entry is not a todo
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Sort out car insurance", "done": false, "subTodos": [{"id": "b", "text": "Call current insurer", "done": false}, {"nonsense": true}]} |
      When I open the app
      Then "Sort out car insurance" has the sub-todos:
        | Call current insurer |

    Example: a parent stored as done over an unfinished sub-todo
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Sort out car insurance", "done": true, "subTodos": [{"id": "b", "text": "Call current insurer", "done": false}]} |
      When I open the app
      Then "Sort out car insurance" is shown as unfinished

  @rule:recover-from-bad-notepads
  Rule: Junk in the notepads key still opens a usable notepad

    Example: the value is not valid JSON
      Given "todo-change.notepads" holds "{not json"
      When I open the app
      Then the open notepad is named "My list"
      And the list is empty

    Example: one entry in the notepads is not a notepad
      Given "todo-change.notepads" holds:
        | {"notepads": [{"id": "a", "name": "Home", "todos": []}, {"nonsense": true}], "openId": "a"} |
      When I open the app
      Then the notepads are:
        | Home |

    Example: the notepad said to be open is not there
      Given "todo-change.notepads" holds:
        | {"notepads": [{"id": "a", "name": "Home", "todos": []}], "openId": "gone"} |
      When I open the app
      Then the open notepad is named "Home"
