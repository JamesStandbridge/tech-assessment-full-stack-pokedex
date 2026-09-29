Feature: Discover an answer without knowing its vocabulary
  A trainer wants to put an opponent to sleep without knowing which moves,
  abilities or Pokémon can help.

  Effect words are matched against short effects. Matching moves and
  abilities lead to the Pokémon that learn or carry them. Guaranteed effects
  rank before chance-based ones, and accurate moves before inaccurate ones.

  Pitfalls in the dataset:
  - Nine moves mention sleep only because their long effect says they cannot
    be selected by Sleep Talk.
  - rest makes the user sleep; thrash and petal-dance confuse the user.
  - dream-eater requires a sleeping target but does not cause sleep.
  - insomnia and vital-spirit prevent sleep, limber prevents paralysis,
    water-veil prevents burns.
  - snorlax and dodrio mention sleeping in their species descriptions only.
  - "asleep" never appears in effects.

  @SRCH-INTENT-001 @SRCH-INTENT-002 @SRCH-INTENT-003 @SRCH-INTENT-005 @SRCH-INTENT-006
  Scenario: Put the opponent to sleep
    When I search for "put the opponent to sleep"
    Then the outcome is "results"
    And the results include:
      | result               |
      | move:sing            |
      | move:sleep-powder    |
      | move:hypnosis        |
      | move:lovely-kiss     |
      | move:spore           |
      | ability:effect-spore |
      | pokemon:jynx         |
      | pokemon:paras        |
      | pokemon:gengar       |
      | pokemon:jigglypuff   |
      | pokemon:venusaur     |
    And the results exclude:
      | result               |
      | move:rest            |
      | move:dream-eater     |
      | move:razor-wind      |
      | move:fly             |
      | move:dig             |
      | move:bide            |
      | move:metronome       |
      | move:mirror-move     |
      | move:skull-bash      |
      | move:sky-attack      |
      | move:substitute      |
      | move:solar-beam      |
      | ability:insomnia     |
      | ability:vital-spirit |
      | ability:early-bird   |
      | ability:soundproof   |
      | ability:guts         |
      | ability:leaf-guard   |
      | pokemon:snorlax      |
      | pokemon:dodrio       |
    And "move:spore" ranks before "move:sing"

  @SRCH-INTENT-002
  Scenario: A bare keyword ignores references to other mechanics
    When I search for "sleep"
    Then the outcome is "results"
    And the results include:
      | result            |
      | move:sing         |
      | move:sleep-powder |
      | move:hypnosis     |
      | move:lovely-kiss  |
      | move:spore        |
    And the results exclude:
      | result           |
      | move:razor-wind  |
      | move:fly         |
      | move:dig         |
      | move:bide        |
      | move:metronome   |
      | move:mirror-move |
      | move:skull-bash  |
      | move:sky-attack  |
      | move:substitute  |
      | move:solar-beam  |

  @SRCH-INTENT-004 @SRCH-INTENT-003
  Scenario: An inflected effect word finds the same effect
    When I search for "make the target fall asleep"
    Then the outcome is "results"
    And the results include:
      | result            |
      | move:sing         |
      | move:sleep-powder |
      | move:hypnosis     |
      | move:lovely-kiss  |
      | move:spore        |
    And the results exclude:
      | result           |
      | move:rest        |
      | move:dream-eater |

  @SRCH-INTENT-007 @should
  Scenario: Preventing an effect is the opposite need
    When I search for "prevent sleep"
    Then the outcome is "results"
    And the results include:
      | result               |
      | ability:insomnia     |
      | ability:vital-spirit |
      | pokemon:drowzee      |
      | pokemon:hypno        |
    And the results exclude:
      | result            |
      | move:sing         |
      | move:sleep-powder |
      | move:hypnosis     |
      | move:lovely-kiss  |
      | move:spore        |
    And "ability:insomnia" ranks before "ability:effect-spore"

  @SRCH-INTENT-001 @SRCH-INTENT-003 @SRCH-INTENT-006
  Scenario: Paralysis, with guaranteed effects first
    When I search for "paralyze the opponent"
    Then the outcome is "results"
    And the results include:
      | result            |
      | move:thunder-wave |
      | move:stun-spore   |
      | move:glare        |
      | move:body-slam    |
      | move:thunderbolt  |
      | ability:static    |
    And the results exclude:
      | result         |
      | ability:limber |
    And "move:thunder-wave" ranks before "move:thunderbolt"
    And "move:glare" ranks before "move:body-slam"

  @SRCH-INTENT-001 @SRCH-INTENT-003
  Scenario: Burn, where only chance-based sources exist
    When I search for "burn the target"
    Then the outcome is "results"
    And the results include:
      | result             |
      | move:ember         |
      | move:flamethrower  |
      | move:fire-blast    |
      | move:fire-punch    |
      | ability:flame-body |
    And the results exclude:
      | result             |
      | ability:water-veil |

  @SRCH-INTENT-003
  Scenario: Moves that confuse the user are not answers
    When I search for "confuse the opponent"
    Then the outcome is "results"
    And the results include:
      | result            |
      | move:supersonic   |
      | move:confuse-ray  |
      | move:psybeam      |
      | move:confusion    |
      | move:dizzy-punch  |
    And the results exclude:
      | result            |
      | move:thrash       |
      | move:petal-dance  |
      | ability:own-tempo |
