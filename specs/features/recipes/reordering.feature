@feature:recipe-reordering
Feature: Putting a line where it belongs

  A recipe is dictated out of order. "Cream the butter and sugar — oh, and heat
  the oven first." Until now the only way to fix that was to delete every line
  after the mistake and type them again, which for an eight-step method is
  fourteen operations to correct one.

  For the method it is not a tidiness problem, it is a correctness one.
  `../look/spec.md` numbers the steps "because a step's position is part of what
  it says" — a method in the wrong order is a recipe that lies, and it lies most
  at the moment somebody is cooking from it.

  A line is taken by its handle and dropped where it should be. It moves inside
  its own group and nowhere else: an ingredient cannot become a step, because
  what a recipe takes and what you do with it are two different lists that
  happen to sit near each other.

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
  Rule: A line dropped somewhere else in its group lands there

    Example: the step that should have come first
      When I drag the step "Heat the oven to 190C" above "Rub the butter into the flour"
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |

    Example: sending one to the end
      When I drag the step "Rub the butter into the flour" below "Bake for 45 minutes"
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |
        | Rub the butter into the flour |

    Example: the ingredients move the same way
      Given "Apple pie" has the ingredients:
        | 3 apples         |
        | 200g plain flour |
      When I drag the ingredient "200g plain flour" above "3 apples"
      Then "Apple pie" shows the ingredients:
        | 200g plain flour |
        | 3 apples         |

  @rule:line-moves-only-within-its-group
  Rule: An ingredient cannot become a step, and a step cannot become an ingredient

    Example: dropping a step among the ingredients
      Given "Apple pie" has the ingredients:
        | 3 apples |
      When I drag the step "Bake for 45 minutes" onto the ingredient "3 apples"
      Then "Apple pie" shows the ingredients:
        | 3 apples |
      And "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |

  @rule:moving-changes-nothing-but-the-order
  Rule: Moving a line changes where it sits and nothing else

    Example: the words are the words
      When I drag the step "Bake for 45 minutes" above "Heat the oven to 190C"
      Then "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Bake for 45 minutes           |
        | Heat the oven to 190C         |

    Example: a line dropped where it already was is not a change
      When I drag the step "Heat the oven to 190C" above "Bake for 45 minutes"
      Then "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |

    Example: the recipe stays where it is in the contents
      Given the contents reads:
        | Apple pie     |
        | Lemon drizzle |
      And I open the recipe "Apple pie"
      When I drag the step "Bake for 45 minutes" above "Heat the oven to 190C"
      Then the contents reads:
        | Apple pie     |
        | Lemon drizzle |

  @rule:the-new-order-is-kept
  Rule: The order it was put in is the order it is found in

    Example: coming back to it
      When I drag the step "Heat the oven to 190C" above "Rub the butter into the flour"
      And I reload
      And I open the recipe "Apple pie"
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |
