@feature:suggesting-placing
Feature: Where a proposal sits

  The model knows where its lines go. Asked to fill in a method that already
  says "heat the oven" and "bake for 45 minutes", it knows that rubbing the
  butter in belongs between them — and an app that drops every proposal at the
  bottom throws that away, leaving somebody to drag each accepted line into
  place by hand.

  So each line comes back with **the place it should take**, and it is drawn
  there: one list, one run of numbers, your lines and the model's together. A
  method reads as it would read if you took the lot, which is the point of
  seeing it before you do.

  **The place is an index, not a quotation.** Asking the model to name the line
  it should follow means asking it to quote your text back exactly, and one
  wrong character puts the line nowhere. An index cannot be misspelt, and one
  that points past the end simply lands last — which matters because a recipe
  can be typed into while the model is still writing.

  An index is read once, against the group as it stands when the draft arrives.
  After that the proposal sits with its neighbour and travels with it, so
  editing the recipe afterwards moves proposals sensibly rather than shuffling
  them against a list that has moved on.

  Background:
    Given the app is open
    And the AI is on
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"
    And "Apple pie" has the method:
      | Heat the oven to 180C |
      | Bake for 45 minutes   |

  @rule:draft-lands-where-the-model-put-it
  Rule: A proposal is drawn at the place the model gave it

    Example: between two lines that are already there
      Given a model that drafts:
        | steps | 1 | Rub the butter into the flour |
      When I ask for a draft of "Apple pie"
      Then the method reads:
        | Heat the oven to 180C         | mine     |
        | Rub the butter into the flour | proposed |
        | Bake for 45 minutes           | mine     |

    Example: at the very top
      Given a model that drafts:
        | steps | 0 | Weigh everything out |
      When I ask for a draft of "Apple pie"
      Then the method reads:
        | Weigh everything out  | proposed |
        | Heat the oven to 180C | mine     |
        | Bake for 45 minutes   | mine     |

    Example: several at one place, in the order they were drafted
      Given a model that drafts:
        | steps | 1 | Rub the butter into the flour |
        | steps | 1 | Peel and slice the apples     |
      When I ask for a draft of "Apple pie"
      Then the method reads:
        | Heat the oven to 180C         | mine     |
        | Rub the butter into the flour | proposed |
        | Peel and slice the apples     | proposed |
        | Bake for 45 minutes           | mine     |

  @rule:draft-index-out-of-range-lands-last
  Rule: A place that is not there puts the line last, rather than nowhere

    Example: past the end
      Given a model that drafts:
        | steps | 9 | Dust it with sugar |
      When I ask for a draft of "Apple pie"
      Then the method reads:
        | Heat the oven to 180C | mine     |
        | Bake for 45 minutes   | mine     |
        | Dust it with sugar    | proposed |

    Example: no place at all, or a nonsense one
      Given a model that drafts:
        | steps |    | Dust it with sugar |
        | steps | no | Grease the tin     |
      When I ask for a draft of "Apple pie"
      Then the method reads:
        | Heat the oven to 180C | mine     |
        | Bake for 45 minutes   | mine     |
        | Dust it with sugar    | proposed |
        | Grease the tin        | proposed |

  @rule:draft-does-not-touch-what-is-there
  Rule: A draft is added to a recipe, never written over it

    Example: a recipe already half typed
      Given "Apple pie" has the ingredients:
        | 3 apples |
      And a model that drafts:
        | ingredients | 0 | 3 apples         |
        | ingredients | 1 | 200g plain flour |
      When I ask for a draft of "Apple pie"
      Then the proposed ingredients read:
        | 200g plain flour |
      And "Apple pie" shows the ingredients:
        | 3 apples |

    Example: a line already there is not proposed back, whatever case it wears
      Given "Apple pie" has the ingredients:
        | 3 apples |
      And a model that drafts:
        | ingredients | 0 | 3 Apples         |
        | ingredients | 1 | 200g plain flour |
      When I ask for a draft of "Apple pie"
      Then the proposed ingredients read:
        | 200g plain flour |
