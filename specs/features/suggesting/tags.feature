@feature:suggesting-tags
Feature: A model proposing tags for a recipe

  Tagging is the one thing this app has always refused to make anyone do:
  typing out again what is already written down. "2 free-range chicken thighs"
  is on screen, and asking for the word "chicken" to be typed under it is the
  retyping `../../persona.md` names first among what annoys Nell.

  A model reads what is already there and proposes the words. That is the whole
  of what it is for, and it is why it is in this version rather than a later
  one: without it, tags are admin.

  **Nothing it proposes is a tag.** A suggestion is a word on offer until it is
  accepted — a wrong tag nobody approved makes the filter lie quietly, and there
  is no undo anywhere in this app.

  The model belongs to the browser, and most browsers do not have one.
  Everything here therefore describes an app that already works without it:
  tagging by hand is the floor, and this stands on it.

  These rules never assert what a model says. A model is handed to the app the
  way the document and the storage are, so what is asserted is what the app does
  with an answer — never the answer. See `spec.md`.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple cake |
    And "Apple cake" has the ingredients:
      | 200g plain flour |
      | 3 apples         |
    And I open the recipe "Apple cake"

  @rule:suggestions-are-not-tags-until-accepted
  Rule: A suggestion becomes a tag only when it is accepted

    Example: taking one of three
      Given a model that proposes "apple", "cake" and "flour"
      When I ask for tags for "Apple cake"
      Then the suggestions read:
        | apple |
        | cake  |
        | flour |
      And "Apple cake" has no tags
      When I accept the suggestion "apple"
      Then "Apple cake" has the tags:
        | apple |

    Example: turning them all down
      Given a model that proposes "apple" and "flour"
      When I ask for tags for "Apple cake"
      And I dismiss the suggestions
      Then "Apple cake" has no tags

    Example: a word already written down is not offered again
      Given "Apple cake" has the tags:
        | apple |
      And a model that proposes "apple" and "cake"
      When I ask for tags for "Apple cake"
      Then the suggestions read:
        | cake |

  @rule:suggesting-needs-a-model
  Rule: With no model there is nothing to ask, and nothing on screen says otherwise

    Example: a browser that will never have one
      Given there is no model
      Then "Apple cake" offers no way to ask for tags
      And I see no message about a model

    Example: tagging by hand is untouched
      Given there is no model
      When I add the tag "apple" to "Apple cake"
      Then "Apple cake" has the tags:
        | apple |

  @rule:suggesting-says-when-it-cannot
  Rule: A model answering with nothing usable says so, and changes nothing

    Example: nothing came back
      Given a model that proposes nothing
      When I ask for tags for "Apple cake"
      Then I see the message "No tags suggested."
      And "Apple cake" has no tags

    Example: the model failed
      Given a model that fails
      When I ask for tags for "Apple cake"
      Then I see the message "Tags could not be suggested."
      And "Apple cake" has no tags
      And "Apple cake" shows the ingredients:
        | 200g plain flour |
        | 3 apples         |

  @rule:the-model-is-the-one-slow-thing
  Rule: A model that has to be fetched first says so, and nothing else waits for it

    Example: the first ask on a fresh browser
      Given a model that has to be fetched first
      When I ask for tags for "Apple cake"
      Then I see the message "Fetching the model…"
      And I add the tag "apple" to "Apple cake"
      And "Apple cake" has the tags:
        | apple |
