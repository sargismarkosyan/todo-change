@feature:suggesting-related
Feature: A model relating a typed word to the tags in use

  The tag box is picked from rather than typed into, but a few books' worth of
  tags is more than fits under the eye, so typing narrows the offer. Typing
  matches letters, though, and the word that comes to mind at the fridge is
  often not the word that was written down: "pig" and "pork", "aubergine" and
  "eggplant", "coriander" and "cilantro".

  A model closes that gap by pointing at tags that already exist. It never
  invents one — a door onto nothing is worse than no door — so the most it can
  do is offer a word out of your own books that you did not type.

  This sits on the finding path, and `../../spec.md` says finding is instant. So
  the letters answer first and are never held back, and a related word arrives
  underneath them if and when it arrives. A slow model costs nothing, and a
  browser with no model shows the same box with one group missing.

  Background:
    Given the app is open
    And the books are:
      | Sweets |
      | Dinner |
    And the book "Dinner" holds:
      | Roast pork |
    And "Roast pork" has the tags:
      | pork |
      | slow |

  @planned @rule:related-tags-never-hold-anything-up
  Rule: Tags matching the letters appear first, without waiting for a model

    Example: a model that has not answered yet
      Given a model that has not answered yet
      When I type "po" into the tag box
      Then the tags offered read:
        | pork |
      And there are no related tags

    Example: the related ones arrive underneath, kept apart
      Given a model that relates "pig" to "pork"
      When I type "pig" into the tag box
      Then the tags offered are empty
      And the related tags read:
        | pork |

  @planned @rule:related-tags-are-tags-that-exist
  Rule: A related tag is one already in use, never a new word

    Example: a word from another book is still a word you wrote
      Given a model that relates "pig" to "pork"
      When I type "pig" into the tag box
      And I pick the related tag "pork"
      Then the picked tags read:
        | pork |
      And the results read:
        | Roast pork | Dinner |

    Example: a proposal that is nobody's tag is dropped
      Given a model that relates "pig" to "bacon"
      When I type "pig" into the tag box
      Then there are no related tags

  @planned @rule:no-model-no-related-tags
  Rule: With no model the tag box is the same box, minus the related ones

    Example: typing still narrows the offer
      Given there is no model
      When I type "po" into the tag box
      Then the tags offered read:
        | pork |
      And there are no related tags

    Example: a word never written down finds nothing
      Given there is no model
      When I type "pig" into the tag box
      Then the tags offered are empty
      And there are no related tags
