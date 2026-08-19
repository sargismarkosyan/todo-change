@feature:recipe-reordering
Feature: Putting a line where it belongs

  A recipe is dictated out of order. "Cream the butter and sugar — oh, and heat
  the oven first." Until this existed the only way to fix that was to delete
  every line after the mistake and type them again, which for an eight-step
  method is fourteen operations to correct one.

  For the method it is not a tidiness problem, it is a correctness one.
  `../look/spec.md` numbers the steps "because a step's position is part of what
  it says" — a method in the wrong order is a recipe that lies, and it lies most
  at the moment somebody is cooking from it.

  A line moves inside its own group and nowhere else: an ingredient cannot
  become a step, because what a recipe takes and what you do with it are two
  different lists that happen to sit near each other.

  **These examples move lines with the arrow keys, and that is deliberate.**
  Since 0012 the dragging belongs to SortableJS, and a gesture this app does not
  own is not one it can honestly assert; the keyboard is this app's own code and
  reaches the same state by the same path. What a line does when it moves is
  what is written down here. How a hand moves it is `reordering-by-hand.feature`
  and the browser pass.

  Writing a line down is unchanged. It still goes to the bottom of its group,
  from the one box that group has — moving it afterwards is how it gets anywhere
  else, and that is why there is no second place to type.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"
    And "Apple pie" has the method:
      | Rub the butter into the flour |
      | Heat the oven to 190C         |
      | Bake for 45 minutes           |

  @rule:line-moved-within-its-group
  Rule: A line moved within its group lands where it was put

    Example: the step that should have come first
      When I move the step "Heat the oven to 190C" up
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |

    Example: sending one to the end
      When I move the step "Rub the butter into the flour" down
      And I move the step "Rub the butter into the flour" down
      Then "Apple pie" shows the method:
        | Heat the oven to 190C |
        | Bake for 45 minutes   |
        | Rub the butter into the flour |

    Example: the ingredients move the same way
      Given "Apple pie" has the ingredients:
        | 3 apples         |
        | 200g plain flour |
      When I move the ingredient "200g plain flour" up
      Then "Apple pie" shows the ingredients:
        | 200g plain flour |
        | 3 apples         |

  @rule:line-moves-only-within-its-group
  Rule: A line cannot leave its group, in either direction

    Example: the last step cannot fall into the ingredients
      Given "Apple pie" has the ingredients:
        | 3 apples |
      When I move the step "Bake for 45 minutes" down
      Then "Apple pie" shows the ingredients:
        | 3 apples |
      And "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |

    Example: and the first ingredient cannot climb into the method
      Given "Apple pie" has the ingredients:
        | 3 apples         |
        | 200g plain flour |
      When I move the ingredient "3 apples" up
      Then "Apple pie" shows the ingredients:
        | 3 apples         |
        | 200g plain flour |
      And "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |

  @rule:moving-changes-nothing-but-the-order
  Rule: Moving a line changes where it sits and nothing else

    Example: the words are the words
      When I move the step "Bake for 45 minutes" up
      Then "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Bake for 45 minutes           |
        | Heat the oven to 190C         |

    Example: the recipe stays where it is in the contents
      Given the contents reads:
        | Apple pie     |
        | Lemon drizzle |
      And I open the recipe "Apple pie"
      When I move the step "Bake for 45 minutes" up
      Then the contents reads:
        | Apple pie     |
        | Lemon drizzle |

  @rule:the-new-order-is-kept
  Rule: The order it was put in is the order it is found in

    Example: coming back to it
      When I move the step "Heat the oven to 190C" up
      And I reload
      And I open the recipe "Apple pie"
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |
