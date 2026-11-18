import { WordEntry, Collection, TransitionCategory } from '../types';

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description: 'Literary vocabulary, Georgian period idioms, and character descriptions from Austen’s classic masterpiece.',
    accentColor: '#F59E0B',
    coverImage: '/assets/aistudio/pride_prejudice_cover.png',
    discoveriesCount: 36,
    totalChapters: 61,
    currentChapter: 8,
  },
  {
    id: 'academic-writing',
    title: 'Academic Writing & Rhetoric',
    author: 'Scholarly Discourse',
    description: 'Formal transitions, counter-argument markers, and elevated lexical expressions for essays and publications.',
    accentColor: '#10B981',
    discoveriesCount: 42,
    totalChapters: 12,
    currentChapter: 4,
  },
  {
    id: 'daily-nuance',
    title: 'Daily Expressions & Nuance',
    author: 'Contemporary Idioms',
    description: 'High-frequency nuance words to sound natural, eloquent, and precise in professional conversations.',
    accentColor: '#3B82F6',
    discoveriesCount: 19,
    totalChapters: 5,
    currentChapter: 2,
  }
];

export const INITIAL_WORDS: WordEntry[] = [
  {
    id: 'word-1',
    word: 'mimic',
    type: 'word',
    phonetic: "/'mɪm.ɪk/",
    syllables: 'MI-mik',
    accents: [
      {
        accent: 'British',
        ipa: "/'mɪm.ɪk/",
        flag: '🇬🇧',
        langCode: 'en-GB',
      },
      {
        accent: 'American',
        ipa: "/ˈmɪm.ɪk/",
        flag: '🇺🇸',
        langCode: 'en-US',
      },
      {
        accent: 'Australian',
        ipa: "/ˈmɪm.ɪk/",
        flag: '🇦🇺',
        langCode: 'en-AU',
      }
    ],
    meanings: [
      {
        partOfSpeech: 'verb',
        definitions: [
          {
            definition: "To copy someone's speech, behaviour or movements, often in order to entertain people.",
            example: "She could mimic her professor's voice perfectly."
          },
          {
            definition: "To be similar to something or to imitate the form or behaviour of something.",
            example: "The design mimics the look of wood."
          }
        ]
      },
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: "A person who is skilled at imitating other people.",
            example: "He is a talented mimic and can imitate many famous actors."
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        "Describing vocal or behavioral imitation with uncanny accuracy.",
        "Referring to biomimicry in architecture, materials, and technology."
      ],
      avoidWhen: [
        "Confusing with 'mock' when the imitation is affectionate or neutral rather than malicious."
      ],
      formality: 'Neutral',
      cefr: 'B2'
    },
    relatedExpressions: [
      { phrase: 'emulate', type: 'verb', relation: 'more formal/positive' },
      { phrase: 'ape', type: 'verb', relation: 'informal/clumsy' },
      { phrase: 'echo', type: 'verb', relation: 'subtle resonance' }
    ],
    dateAdded: '2026-11-09T05:30:00.000Z',
    groupDate: 'Today',
    collectionId: 'pride-and-prejudice',
    source: {
      type: 'Book',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      chapter: '4',
      page: '38'
    },
    userNote: 'Notice the double meanings: both performance/imitation and design similarity.',
    tags: ['speaking', 'useful', 'literature'],
    isStarred: true,
    reviewStatus: {
      dueForReview: true,
      intervalDays: 2,
      repetitions: 3,
      nextReviewDate: '2026-11-09'
    }
  },
  {
    id: 'word-2',
    word: 'in a similar vein',
    type: 'transition',
    phonetic: '/ɪn ə ˈsɪm.ɪ.lər veɪn/',
    syllables: 'in a SIM-i-lar vein',
    accents: [
      {
        accent: 'British',
        ipa: '/ɪn ə ˈsɪm.ɪ.lə veɪn/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ɪn ə ˈsɪm.ə.lɚ veɪn/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'transition',
        definitions: [
          {
            definition: 'Used to introduce a related idea, argument, or parallel perspective.',
            example: 'He addressed the rising costs, and in a similar vein, highlighted the need for operational efficiency.'
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        'Bridging two paragraphs that discuss parallel arguments without sounding repetitive.',
        'Transitioning between complementary examples.'
      ],
      avoidWhen: [
        'Introducing a contrasting counter-point.'
      ],
      formality: 'Formal',
      cefr: 'C1'
    },
    relatedExpressions: [
      { phrase: 'by the same token', type: 'transition', relation: 'logical parallel' },
      { phrase: 'likewise', type: 'adverb', relation: 'direct equivalence' },
      { phrase: 'along the same lines', type: 'transition', relation: 'conversational' }
    ],
    dateAdded: '2026-11-09T04:15:00.000Z',
    groupDate: 'Today',
    collectionId: 'academic-writing',
    source: {
      type: 'Article',
      title: 'The Economist'
    },
    tags: ['transition', 'comparison', 'essay'],
    isStarred: false,
    reviewStatus: {
      dueForReview: true,
      intervalDays: 1,
      repetitions: 1
    }
  },
  {
    id: 'word-3',
    word: 'acquiesce',
    type: 'word',
    phonetic: '/ˌæk.wiˈes/',
    syllables: 'ak-wee-ES',
    accents: [
      {
        accent: 'British',
        ipa: '/ˌæk.wiˈes/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ˌæk.wiˈɛs/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'verb',
        definitions: [
          {
            definition: 'To accept something reluctantly but without protest; to submit or comply silently.',
            example: 'She eventually acquiesced to their request after considerable deliberation.'
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        'Conveying passive surrender or quiet compliance rather than enthusiastic consent.',
        'Formal narrative and legal or academic evaluations.'
      ],
      avoidWhen: [
        'Someone actively agrees or champions a proposal.'
      ],
      formality: 'Formal',
      cefr: 'C2'
    },
    relatedExpressions: [
      { phrase: 'concede', type: 'verb', relation: 'admit defeat' },
      { phrase: 'relent', type: 'verb', relation: 'soften resistance' },
      { phrase: 'succumb', type: 'verb', relation: 'overpowered' }
    ],
    dateAdded: '2026-11-09T02:00:00.000Z',
    groupDate: 'Today',
    collectionId: 'pride-and-prejudice',
    source: {
      type: 'Book',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      chapter: '19'
    },
    userNote: 'Preposition note: often used with "in" or "to" (acquiesce in/to).',
    tags: ['verb', 'formal', 'literature'],
    isStarred: true,
    reviewStatus: {
      dueForReview: true,
      intervalDays: 3,
      repetitions: 4
    }
  },
  {
    id: 'word-4',
    word: 'notwithstanding',
    type: 'transition',
    phonetic: '/ˌnɒt.wɪðˈstænd.ɪŋ/',
    syllables: 'not-with-STAN-ding',
    accents: [
      {
        accent: 'British',
        ipa: '/ˌnɒt.wɪðˈstænd.ɪŋ/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ˌnɑːt.wɪðˈstæn.dɪŋ/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'transition',
        definitions: [
          {
            definition: 'In spite of something; despite the fact that.',
            example: 'Notwithstanding the challenging weather conditions, the expedition pressed forward.'
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        'Can be used prepositionally ("notwithstanding the risks") or postpositionally ("the risks notwithstanding").',
        'Elevating essays and analytical writing beyond "although" and "despite".'
      ],
      formality: 'Formal',
      cefr: 'C1'
    },
    relatedExpressions: [
      { phrase: 'in spite of', type: 'preposition', relation: 'everyday equivalent' },
      { phrase: 'regardless of', type: 'preposition', relation: 'indifference' }
    ],
    dateAdded: '2026-11-09T01:10:00.000Z',
    groupDate: 'Today',
    collectionId: 'academic-writing',
    tags: ['transition', 'contrast', 'rhetoric'],
    isStarred: false,
    reviewStatus: {
      dueForReview: true,
      intervalDays: 1,
      repetitions: 2
    }
  },
  {
    id: 'word-5',
    word: 'ostensibly',
    type: 'word',
    phonetic: "/ɒ'sten.sə.bli/",
    syllables: 'os-TEN-si-blee',
    accents: [
      {
        accent: 'British',
        ipa: "/ɒ'sten.sə.bli/",
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ɑːˈsten.sə.bli/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'adverb',
        definitions: [
          {
            definition: 'Apparently or purportedly, but perhaps not actually; as appears on the surface.',
            example: 'She visited the department ostensibly to check on progress, but actually to observe the new director.'
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        'Casting subtle doubt on declared motives or surface appearances.'
      ],
      avoidWhen: [
        'The surface truth is completely verified.'
      ],
      formality: 'Formal',
      cefr: 'C1'
    },
    dateAdded: '2026-11-09T00:30:00.000Z',
    groupDate: 'Today',
    collectionId: 'daily-nuance',
    tags: ['adverb', 'nuance', 'writing'],
    isStarred: true,
    reviewStatus: {
      dueForReview: true,
      intervalDays: 2,
      repetitions: 2
    }
  },
  {
    id: 'word-6',
    word: 'by the same token',
    type: 'transition',
    phonetic: '/baɪ ðə seɪm ˈtoʊkən/',
    syllables: 'by the same TO-ken',
    accents: [
      {
        accent: 'British',
        ipa: '/baɪ ðə seɪm ˈtəʊkən/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/baɪ ðə seɪm ˈtoʊkən/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'transition',
        definitions: [
          {
            definition: 'Used to introduce something that is true for the same reason as what has just been mentioned.',
            example: 'We cannot expect students to meet every deadline; by the same token, deadlines cannot simply be ignored.'
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        'Connecting two ideas that point in a similar direction.',
        'Showing that the same logic or rule applies to a second situation.'
      ],
      avoidWhen: [
        'The second point actually contradicts the first.'
      ],
      formality: 'Formal',
      cefr: 'C1'
    },
    relatedExpressions: [
      { phrase: 'in a similar vein', type: 'transition', relation: 'stylistic equivalent' },
      { phrase: 'likewise', type: 'transition', relation: 'concise parallel' },
      { phrase: 'equally important', type: 'transition', relation: 'weight emphasis' },
      { phrase: 'for the same reason', type: 'transition', relation: 'literal logic' }
    ],
    dateAdded: '2026-11-08T18:00:00.000Z',
    groupDate: 'Yesterday',
    collectionId: 'academic-writing',
    tags: ['transition', 'addition', 'comparison', 'formal'],
    isStarred: true,
    reviewStatus: {
      dueForReview: false,
      intervalDays: 4,
      repetitions: 5
    }
  },
  {
    id: 'word-7',
    word: 'tolerable',
    type: 'word',
    phonetic: "/'tɒl.ər.ə.bəl/",
    syllables: 'TOL-er-a-ble',
    accents: [
      {
        accent: 'British',
        ipa: "/'tɒl.ər.ə.bəl/",
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ˈtɑː.lɚ.ə.bəl/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Able to be accepted, endured, or deemed passable.',
            example: 'She is tolerable; but not handsome enough to tempt me.'
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: [
        'Conveying lukewarm praise or begrudging endurance.'
      ],
      formality: 'Literary',
      cefr: 'B2'
    },
    dateAdded: '2026-11-08T15:20:00.000Z',
    groupDate: 'Yesterday',
    chapter: 'Chapter 3',
    collectionId: 'pride-and-prejudice',
    source: {
      type: 'Book',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      chapter: '3',
      page: '27'
    },
    tags: ['adjective', 'contrast', 'classic'],
    isStarred: true,
    reviewStatus: {
      dueForReview: true,
      intervalDays: 1,
      repetitions: 2
    }
  },
  {
    id: 'word-8',
    word: 'in consequence',
    type: 'transition',
    phonetic: '/ɪn ˈkɒn.sɪ.kwəns/',
    syllables: 'in CON-se-quence',
    accents: [
      {
        accent: 'British',
        ipa: '/ɪn ˈkɒn.sɪ.kwəns/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ɪn ˈkɑːn.sə.kwens/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'transition',
        definitions: [
          {
            definition: 'As a direct result or outcome of what preceded.',
            example: 'In consequence, they decided to leave early before the storm intensified.'
          }
        ]
      }
    ],
    dateAdded: '2026-11-08T14:00:00.000Z',
    groupDate: 'Yesterday',
    chapter: 'Chapter 3',
    collectionId: 'pride-and-prejudice',
    tags: ['transition', 'cause/reason'],
    isStarred: false
  },
  {
    id: 'word-9',
    word: '“I declare after all there is no enjoyment like reading!”',
    type: 'quote',
    phonetic: '',
    accents: [],
    meanings: [
      {
        partOfSpeech: 'quote',
        definitions: [
          {
            definition: 'Miss Caroline Bingley’s theatrical proclamation in the drawing room at Netherfield.',
            example: '“How much sooner one tires of any thing than of a book! When I have a house of my own, I shall be miserable if I have not an excellent library.”'
          }
        ]
      }
    ],
    quoteAuthor: 'Jane Austen',
    quoteWork: 'Pride and Prejudice (Miss Bingley)',
    dateAdded: '2026-11-08T12:00:00.000Z',
    groupDate: 'Yesterday',
    chapter: 'Chapter 11',
    collectionId: 'pride-and-prejudice',
    tags: ['quote', 'humor', 'books'],
    isStarred: true
  },
  {
    id: 'word-10',
    word: 'acquaintance',
    type: 'word',
    phonetic: '/əˈkweɪn.təns/',
    syllables: 'ac-QUAIN-tance',
    accents: [
      {
        accent: 'British',
        ipa: '/əˈkweɪn.təns/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/əˈkweɪn.təns/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'Knowledge or familiarity with someone or something; a person known slightly.',
            example: 'Their acquaintance had begun only a few weeks before at the ball.'
          }
        ]
      }
    ],
    dateAdded: '2026-11-07T16:00:00.000Z',
    groupDate: 'Earlier',
    chapter: 'Chapter 8',
    collectionId: 'pride-and-prejudice',
    tags: ['noun', 'society'],
    isStarred: true
  },
  {
    id: 'word-11',
    word: 'character',
    type: 'word',
    phonetic: '/ˈkær.ək.tər/',
    syllables: 'CHAR-ac-ter',
    accents: [
      {
        accent: 'British',
        ipa: '/ˈkær.ək.tə/',
        flag: '🇬🇧',
        langCode: 'en-GB'
      },
      {
        accent: 'American',
        ipa: '/ˈker.ək.tɚ/',
        flag: '🇺🇸',
        langCode: 'en-US'
      }
    ],
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The mental and moral qualities distinctive to an individual.',
            example: 'Her character is one of extraordinary complexity and subtle pride.'
          }
        ]
      }
    ],
    dateAdded: '2026-11-07T11:00:00.000Z',
    groupDate: 'Earlier',
    chapter: 'Chapter 8',
    collectionId: 'pride-and-prejudice',
    tags: ['noun', 'analysis'],
    isStarred: false
  }
];

export const TRANSITION_CATEGORIES: TransitionCategory[] = [
  {
    id: 'addition',
    name: 'Addition',
    count: 7,
    description: 'Introducing supplementary points, cumulative reasoning, or reinforcing statements.',
    examples: [
      {
        id: 'exp-by-the-same-token',
        word: 'By the same token',
        type: 'transition',
        phonetic: '/baɪ ðə seɪm ˈtoʊ.kən/',
        syllables: 'by the same TO-ken',
        accents: [
          { accent: 'British', ipa: '/baɪ ðə seɪm ˈtəʊ.kən/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/baɪ ðə seɪm ˈtoʊ.kən/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used to introduce something that is true for the same reason as what has just been mentioned.',
                example: 'We cannot expect students to meet every deadline; by the same token, deadlines cannot simply be ignored.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: [
            'Connecting two ideas that point in a similar direction.',
            'Showing that the same logic or rule applies to a second situation.'
          ],
          avoidWhen: [
            'The second point actually contradicts the first.'
          ],
          formality: 'Formal',
          cefr: 'C1'
        },
        relatedExpressions: [
          { phrase: 'in a similar vein', type: 'transition', relation: 'stylistic equivalent' },
          { phrase: 'likewise', type: 'transition', relation: 'concise parallel' },
          { phrase: 'equally important', type: 'transition', relation: 'weight emphasis' },
          { phrase: 'for the same reason', type: 'transition', relation: 'literal logic' }
        ],
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition', 'comparison', 'formal']
      },
      {
        id: 'exp-in-a-similar-vein',
        word: 'In a similar vein',
        type: 'transition',
        phonetic: '/ɪn ə ˈsɪm.ɪ.lər veɪn/',
        syllables: 'in a SIM-i-lar vein',
        accents: [
          { accent: 'British', ipa: '/ɪn ə ˈsɪm.ɪ.lə veɪn/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn ə ˈsɪm.ə.lɚ veɪn/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used to introduce a related idea, argument, or parallel perspective.',
                example: 'He addressed the rising operational costs, and in a similar vein, touched upon quarterly logistics.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: [
            'Transitioning between complementary examples without sounding repetitive.'
          ],
          avoidWhen: ['Introducing a contrasting counterpoint.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        relatedExpressions: [
          { phrase: 'by the same token', type: 'transition', relation: 'parallel reasoning' },
          { phrase: 'along the same lines', type: 'transition', relation: 'conversational' }
        ],
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition', 'comparison']
      },
      {
        id: 'exp-furthermore',
        word: 'Furthermore',
        type: 'transition',
        phonetic: '/ˌfɜː.ðəˈmɔːr/',
        syllables: 'fur-ther-MORE',
        accents: [
          { accent: 'British', ipa: '/ˌfɜː.ðəˈmɔː/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˌfɝː.ðɚˈmɔːr/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'In addition to what has been said; giving a second, weightier argument.',
                example: 'The evidence is inconclusive; furthermore, key documents remain inaccessible.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Stacking persuasive evidence in essay writing and rhetoric.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition', 'essay']
      },
      {
        id: 'exp-moreover',
        word: 'Moreover',
        type: 'transition',
        phonetic: '/mɔːrˈoʊ.vər/',
        syllables: 'more-O-ver',
        accents: [
          { accent: 'British', ipa: '/mɔːrˈəʊ.və/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/mɔːrˈoʊ.vɚ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used to introduce a further matter of interest, expansion, or reinforcement.',
                example: 'The proposal is commercially viable; moreover, it commands broad board consensus.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Advancing to an even stronger secondary pillar of support.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition']
      },
      {
        id: 'exp-by-extension',
        word: 'By extension',
        type: 'transition',
        phonetic: '/baɪ ɪkˈsten.ʃən/',
        syllables: 'by ex-TEN-sion',
        accents: [
          { accent: 'British', ipa: '/baɪ ɪkˈsten.ʃən/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/baɪ ɪkˈsten.ʃən/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Taking the premise one step further to embrace related consequences or stakeholders.',
                example: 'Protecting the local watershed safeguards farmers, and by extension, regional food security.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Broadening an argument from a specific instance to its wider systemic ripple.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition']
      },
      {
        id: 'exp-in-addition-to-this',
        word: 'In addition to this',
        type: 'transition',
        phonetic: '/ɪn əˈdɪʃ.ən tuː ðɪs/',
        syllables: 'in ad-DI-tion to this',
        accents: [
          { accent: 'British', ipa: '/ɪn əˈdɪʃ.ən tuː ðɪs/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn əˈdɪʃ.ən tuː ðɪs/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Introducing a supplementary fact or dimension to round out the reasoning.',
                example: 'In addition to this, the laboratory renewed its full accreditation for clinical toxicology.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Providing clear, transparent additive structure in professional documentation.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition']
      },
      {
        id: 'exp-what-is-more',
        word: 'What is more',
        type: 'transition',
        phonetic: '/wɒt ɪz mɔːr/',
        syllables: 'what is MORE',
        accents: [
          { accent: 'British', ipa: '/wɒt ɪz mɔː/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/wɑːt ɪz mɔːr/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used to add an emphatic or striking additional fact.',
                example: 'The team completed the survey early; what is more, they uncovered three pristine archaeological sites.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Injecting positive momentum and heightened reader interest into a series of points.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'addition']
      }
    ]
  },
  {
    id: 'contrast',
    name: 'Contrast',
    count: 6,
    description: 'Establishing tension, counter-arguments, qualifications, or divergences.',
    examples: [
      {
        id: 'exp-notwithstanding',
        word: 'Notwithstanding',
        type: 'transition',
        phonetic: '/ˌnɒt.wɪðˈstænd.ɪŋ/',
        syllables: 'not-with-STAN-ding',
        accents: [
          { accent: 'British', ipa: '/ˌnɒt.wɪðˈstænd.ɪŋ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˌnɑːt.wɪðˈstæn.dɪŋ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'In spite of something; despite the fact that.',
                example: 'Notwithstanding the challenging weather conditions, the expedition pressed forward.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: [
            'Can be used prepositionally ("notwithstanding the risks") or postpositionally ("the risks notwithstanding").',
            'Elevating analytical writing beyond basic "although" and "despite".'
          ],
          formality: 'Formal',
          cefr: 'C1'
        },
        relatedExpressions: [
          { phrase: 'in spite of', type: 'preposition', relation: 'everyday equivalent' },
          { phrase: 'regardless of', type: 'preposition', relation: 'indifference' }
        ],
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'contrast', 'rhetoric']
      },
      {
        id: 'exp-conversely',
        word: 'Conversely',
        type: 'transition',
        phonetic: '/ˈkɒn.vɜːs.li/',
        syllables: 'CON-verse-ly',
        accents: [
          { accent: 'British', ipa: '/ˈkɒn.vɜːs.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/kənˈvɝːs.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Introducing a statement or fact which reverses the previous proposition.',
                example: 'High inflation dampens consumer confidence; conversely, stable prices encourage investment.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Comparing two symmetrical but inverted scenarios.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'contrast']
      },
      {
        id: 'exp-on-the-contrary',
        word: 'On the contrary',
        type: 'transition',
        phonetic: '/ɒn ðə ˈkɒn.trə.ri/',
        syllables: 'on the CON-tra-ry',
        accents: [
          { accent: 'British', ipa: '/ɒn ðə ˈkɒn.trə.ri/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɑːn ðə ˈkɑːn.trer.i/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used to intensify a denial of what was just said and introduce the complete opposite reality.',
                example: 'It was not a sign of retreat; on the contrary, it marked the beginning of an aggressive offensive.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Directly refuting a misconception with decisive counter-proof.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'contrast']
      },
      {
        id: 'exp-that-having-been-said',
        word: 'That having been said',
        type: 'transition',
        phonetic: '/ðæt ˈhæv.ɪŋ biːn sed/',
        syllables: 'that hav-ing been SAID',
        accents: [
          { accent: 'British', ipa: '/ðæt ˈhæv.ɪŋ biːn sed/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ðæt ˈhæv.ɪŋ bɪn sed/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Signaling a shift to a qualifying or moderating consideration after acknowledging a strong claim.',
                example: 'The early metrics look promising. That having been said, long-term durability remains untested.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Balancing optimism with prudent caution in executive summaries.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'contrast']
      },
      {
        id: 'exp-in-stark-contrast',
        word: 'In stark contrast',
        type: 'transition',
        phonetic: '/ɪn stɑːk ˈkɒn.trɑːst/',
        syllables: 'in stark CON-trast',
        accents: [
          { accent: 'British', ipa: '/ɪn stɑːk ˈkɒn.trɑːst/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn stɑːrk ˈkɑːn.træst/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Emphasizing an unmistakable, sharp disparity between two subjects.',
                example: 'The capital thrived; in stark contrast, the peripheral provinces suffered acute stagnation.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Highlighting dramatic structural or socio-economic differences.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'contrast']
      },
      {
        id: 'exp-even-so',
        word: 'Even so',
        type: 'transition',
        phonetic: '/ˈiː.vən soʊ/',
        syllables: 'E-ven SO',
        accents: [
          { accent: 'British', ipa: '/ˈiː.vən səʊ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈiː.vən soʊ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Despite that being true; nonetheless.',
                example: 'The odds were slim; even so, the research team persevered through the final trials.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Pithy, high-impact transitional pivot in narrative and reflective prose.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'contrast']
      }
    ]
  },
  {
    id: 'cause-reason',
    name: 'Cause / Reason',
    count: 5,
    description: 'Articulating logical antecedents, causality, justifications, and implications.',
    examples: [
      {
        id: 'exp-in-consequence',
        word: 'In consequence',
        type: 'transition',
        phonetic: '/ɪn ˈkɒn.sɪ.kwəns/',
        syllables: 'in CON-se-quence',
        accents: [
          { accent: 'British', ipa: '/ɪn ˈkɒn.sɪ.kwəns/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn ˈkɑːn.sə.kwens/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'As a direct result or outcome of what preceded.',
                example: 'The harvest failed in late autumn; in consequence, grain reserves were severely restricted.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Emphasizing severe or direct causal repercussions in historical or analytical texts.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'cause/reason']
      },
      {
        id: 'exp-by-virtue-of',
        word: 'By virtue of',
        type: 'transition',
        phonetic: '/baɪ ˈvɜː.tʃuː əv/',
        syllables: 'by VIR-tue of',
        accents: [
          { accent: 'British', ipa: '/baɪ ˈvɜː.tʃuː əv/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/baɪ ˈvɝː.tʃuː əv/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Because of, or through the direct authority or merit of.',
                example: 'She commanded authority by virtue of her unmatched fieldwork across four continents.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Attributing legitimate influence or cause to an inherent attribute.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'cause/reason']
      },
      {
        id: 'exp-on-account-of',
        word: 'On account of',
        type: 'transition',
        phonetic: '/ɒn əˈkaʊnt əv/',
        syllables: 'on ac-COUNT of',
        accents: [
          { accent: 'British', ipa: '/ɒn əˈkaʊnt əv/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɑːn əˈkaʊnt əv/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Due to; owing specifically to a given condition or event.',
                example: 'Flights were grounded on account of torrential crosswinds over the channel.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Stating immediate, objective grounds for an action or disruption.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'cause/reason']
      },
      {
        id: 'exp-owing-to-the-fact-that',
        word: 'Owing to the fact that',
        type: 'transition',
        phonetic: '/ˈoʊ.ɪŋ tuː ðə fækt ðæt/',
        syllables: 'OW-ing to the fact that',
        accents: [
          { accent: 'British', ipa: '/ˈəʊ.ɪŋ tuː ðə fækt ðæt/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈoʊ.ɪŋ tuː ðə fækt ðæt/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Formally indicating that a state of affairs directly springs from a verified fact.',
                example: 'Owing to the fact that the alloy was rust-resistant, it was selected for maritime rigging.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Formal technical rationale where precise causal justification is essential.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'cause/reason']
      },
      {
        id: 'exp-for-this-very-reason',
        word: 'For this very reason',
        type: 'transition',
        phonetic: '/fɔːr ðɪs ˈver.i ˈriː.zən/',
        syllables: 'for this VE-ry REA-son',
        accents: [
          { accent: 'British', ipa: '/fɔː ðɪs ˈver.i ˈriː.zən/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/fɔːr ðɪs ˈver.i ˈriː.zən/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Emphatically tying an imperative or response directly to the stated dilemma.',
                example: 'Urban transit is congested; for this very reason, cycling infrastructure warrants expansion.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Rhetorically turning a known problem into an immediate call for action.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'cause/reason']
      }
    ]
  },
  {
    id: 'example',
    name: 'Example',
    count: 4,
    description: 'Supplying concrete case studies, manifestations, and illustrative instances.',
    examples: [
      {
        id: 'exp-case-in-point',
        word: 'Case in point',
        type: 'transition',
        phonetic: '/keɪs ɪn pɔɪnt/',
        syllables: 'case in POINT',
        accents: [
          { accent: 'British', ipa: '/keɪs ɪn pɔɪnt/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/keɪs ɪn pɔɪnt/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'An instance or example that proves or exemplifies the point currently being argued.',
                example: 'Small firms frequently outpace giants in innovation; a case in point is the biotech surge.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Anchoring an abstract thesis to an undeniable concrete example.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'example']
      },
      {
        id: 'exp-by-way-of-illustration',
        word: 'By way of illustration',
        type: 'transition',
        phonetic: '/baɪ weɪ əv ˌɪl.əˈstreɪ.ʃən/',
        syllables: 'by way of il-lus-TRA-tion',
        accents: [
          { accent: 'British', ipa: '/baɪ weɪ əv ˌɪl.əˈstreɪ.ʃən/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/baɪ weɪ əv ˌɪl.əˈstreɪ.ʃən/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Serving to explain or clarify a complex idea through a practical demonstration.',
                example: 'By way of illustration, consider the trajectory of an unmoored buoy in changing tides.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Introducing an extended narrative or metaphorical example in lectures and essays.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'example']
      },
      {
        id: 'exp-for-instance',
        word: 'For instance',
        type: 'transition',
        phonetic: '/fɔːr ˈɪn.stəns/',
        syllables: 'for IN-stance',
        accents: [
          { accent: 'British', ipa: '/fɔː ˈɪn.stəns/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/fɔːr ˈɪn.stəns/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'As an example of a broader category or principle.',
                example: 'Several European economies, for instance Denmark and Sweden, heavily rely on offshore wind.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Seamlessly embedding representative specimens inside a continuous sentence.'],
          formality: 'Neutral',
          cefr: 'B1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'example']
      },
      {
        id: 'exp-as-evidenced-by',
        word: 'As evidenced by',
        type: 'transition',
        phonetic: '/æz ˈev.ɪ.dənst baɪ/',
        syllables: 'as EV-i-denced by',
        accents: [
          { accent: 'British', ipa: '/æz ˈev.ɪ.dənst baɪ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/æz ˈev.ə.dənst baɪ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Directly demonstrating that empirical proof substantiates the preceding claim.',
                example: 'Consumer demand has pivoted toward sustainability, as evidenced by double-digit thrift market growth.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Backing up assertions with demonstrable statistical or documentary proof.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'example']
      }
    ]
  },
  {
    id: 'emphasis',
    name: 'Emphasis',
    count: 5,
    description: 'Highlighting pivotal insights, non-negotiable points, and sharp focuses.',
    examples: [
      {
        id: 'exp-chiefly',
        word: 'Chiefly',
        type: 'transition',
        phonetic: '/ˈtʃiːf.li/',
        syllables: 'CHIEF-ly',
        accents: [
          { accent: 'British', ipa: '/ˈtʃiːf.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈtʃiːf.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Above all; mainly; predominantly.',
                example: 'He succeeded chiefly through stubborn discipline rather than sudden inspiration.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Isolating the primary factor among multiple contributing elements.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'emphasis']
      },
      {
        id: 'exp-above-all',
        word: 'Above all',
        type: 'transition',
        phonetic: '/əˈbʌv ɔːl/',
        syllables: 'a-bove ALL',
        accents: [
          { accent: 'British', ipa: '/əˈbʌv ɔːl/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/əˈbʌv ɑːl/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'More than anything else; prioritising the paramount rule or objective.',
                example: 'Above all, maintain integrity when pressure mounts.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Stating the crowning moral, strategic, or practical priority.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'emphasis']
      },
      {
        id: 'exp-in-particular',
        word: 'In particular',
        type: 'transition',
        phonetic: '/ɪn pəˈtɪk.jə.lər/',
        syllables: 'in par-TI-cu-lar',
        accents: [
          { accent: 'British', ipa: '/ɪn pəˈtɪk.jə.lə/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn pɚˈtɪk.jə.lɚ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Singling out a notable individual component from a broad collective.',
                example: 'Renewable investments grew across the board; in particular, solar installations quadrupled.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Shifting focus from a general trend to a striking standout figure.'],
          formality: 'Neutral',
          cefr: 'B1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'emphasis']
      },
      {
        id: 'exp-significantly',
        word: 'Significantly',
        type: 'transition',
        phonetic: '/sɪɡˈnɪf.ɪ.kənt.li/',
        syllables: 'sig-NIF-i-cant-ly',
        accents: [
          { accent: 'British', ipa: '/sɪɡˈnɪf.ɪ.kənt.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/sɪɡˈnɪf.ə.kənt.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'In a way that is large or important enough to have an effect or be noticed.',
                example: 'Significantly, the second cohort demonstrated zero relapse over the twenty-four month surveillance.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Directing reader attention to a fact with profound interpretive weight.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'emphasis']
      },
      {
        id: 'exp-crucially',
        word: 'Crucially',
        type: 'transition',
        phonetic: '/ˈkruː.ʃəl.i/',
        syllables: 'CRU-cial-ly',
        accents: [
          { accent: 'British', ipa: '/ˈkruː.ʃəl.i/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈkruː.ʃəl.i/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Indicating a decisive factor upon which the entire outcome hinges.',
                example: 'Crucially, the emergency generators kicked in before cryogenic temperatures degraded.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Pinpointing the make-or-break pivot in a chronological sequence.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'emphasis']
      }
    ]
  },
  {
    id: 'clarification',
    name: 'Clarification',
    count: 4,
    description: 'Rephrasing, disambiguating subtle distinctions, and distilling essence.',
    examples: [
      {
        id: 'exp-that-is-to-say',
        word: 'That is to say',
        type: 'transition',
        phonetic: '/ðæt ɪz tuː seɪ/',
        syllables: 'that is to SAY',
        accents: [
          { accent: 'British', ipa: '/ðæt ɪz tuː seɪ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ðæt ɪz tuː seɪ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used to indicate that you are explaining or expanding on previous phrasing.',
                example: 'The contract is non-exclusive; that is to say, either party may pursue parallel vendors.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Refining legal or philosophical precision without losing reader clarity.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'clarification']
      },
      {
        id: 'exp-in-other-words',
        word: 'In other words',
        type: 'transition',
        phonetic: '/ɪn ˈʌð.ər wɜːdz/',
        syllables: 'in O-ther WORDS',
        accents: [
          { accent: 'British', ipa: '/ɪn ˈʌð.ə wɜːdz/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn ˈʌð.ɚ wɝːdz/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Restating an idea in simpler or alternate phrasing to ensure comprehension.',
                example: 'The firm burned through remaining cash; in other words, insolvency was imminent.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Translating dense jargon into plain, striking reality.'],
          formality: 'Neutral',
          cefr: 'B1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'clarification']
      },
      {
        id: 'exp-to-put-it-another-way',
        word: 'To put it another way',
        type: 'transition',
        phonetic: '/tuː pʊt ɪt əˈnʌð.ər weɪ/',
        syllables: 'to put it an-O-ther WAY',
        accents: [
          { accent: 'British', ipa: '/tuː pʊt ɪt əˈnʌð.ə weɪ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/tuː pʊt ɪt əˈnʌð.ɚ weɪ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Reframing the message from a distinct angle to unlock deeper intuition.',
                example: 'The asset has high upside volatility; to put it another way, expect wild swings.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Providing a second conceptual lens for the listener.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'clarification']
      },
      {
        id: 'exp-more-precisely',
        word: 'More precisely',
        type: 'transition',
        phonetic: '/mɔːr prɪˈsaɪs.li/',
        syllables: 'more pre-CISE-ly',
        accents: [
          { accent: 'British', ipa: '/mɔː prɪˈsaɪs.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/mɔːr prɪˈsaɪs.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Tightening up a general claim into an exact empirical or technical boundary.',
                example: 'The organism survives in extreme cold; more precisely, down to negative forty Celsius.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Narrowing scope from colloquial approximation to scientific rigor.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'clarification']
      }
    ]
  },
  {
    id: 'conclusion',
    name: 'Conclusion',
    count: 5,
    description: 'Synthesizing arguments, drawing final deductions, and summarizing impact.',
    examples: [
      {
        id: 'exp-in-the-final-analysis',
        word: 'In the final analysis',
        type: 'transition',
        phonetic: '/ɪn ðə ˈfaɪ.nəl əˈnæl.ə.sɪs/',
        syllables: 'in the fi-nal a-NAL-y-sis',
        accents: [
          { accent: 'British', ipa: '/ɪn ðə ˈfaɪ.nəl əˈnæl.ə.sɪs/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn ðə ˈfaɪ.nəl əˈnæl.ə.sɪs/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'When all factors and circumstances have been weighed and considered.',
                example: 'In the final analysis, character matters far more than transient circumstances.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Concluding an essay or argument with decisive gravitas.'],
          formality: 'Formal',
          cefr: 'C2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'conclusion']
      },
      {
        id: 'exp-all-things-considered',
        word: 'All things considered',
        type: 'transition',
        phonetic: '/ɔːl θɪŋz kənˈsɪd.əd/',
        syllables: 'all things con-SI-dered',
        accents: [
          { accent: 'British', ipa: '/ɔːl θɪŋz kənˈsɪd.əd/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɑːl θɪŋz kənˈsɪd.ɚd/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Taking all aspects and complications into account before making a judgment.',
                example: 'All things considered, the maiden flight proved an unqualified engineering triumph.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Delivering a measured, mature summary assessment.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'conclusion']
      },
      {
        id: 'exp-to-sum-up',
        word: 'To sum up',
        type: 'transition',
        phonetic: '/tuː sʌm ʌp/',
        syllables: 'to sum UP',
        accents: [
          { accent: 'British', ipa: '/tuː sʌm ʌp/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/tuː sʌm ʌp/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Indicating a short review or recapitulation of the main points.',
                example: 'To sum up, our recommendations span immediate triage, funding realignments, and staff retention.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Opening a final summary slide or conclusion section cleanly.'],
          formality: 'Neutral',
          cefr: 'B1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'conclusion']
      },
      {
        id: 'exp-in-essence',
        word: 'In essence',
        type: 'transition',
        phonetic: '/ɪn ˈes.əns/',
        syllables: 'in ES-sence',
        accents: [
          { accent: 'British', ipa: '/ɪn ˈes.əns/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn ˈes.əns/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Distilling an argument down to its fundamental, irreducible core truth.',
                example: 'In essence, the treaty establishes a permanent arbitration corridor between both states.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Cutting through procedural noise to illuminate the essential thesis.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'conclusion']
      },
      {
        id: 'exp-ultimately',
        word: 'Ultimately',
        type: 'transition',
        phonetic: '/ˈʌl.tɪ.mət.li/',
        syllables: 'UL-ti-mate-ly',
        accents: [
          { accent: 'British', ipa: '/ˈʌl.tɪ.mət.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈʌl.tə.mət.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Finally, after a series of events, disputes, or deliberation.',
                example: 'Ultimately, consumer behavior decided which operating system dominated the market.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Stating the overarching historical outcome that settled all debate.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'conclusion']
      }
    ]
  },
  {
    id: 'concession',
    name: 'Concession',
    count: 4,
    description: 'Acknowledging opposing merits before advancing the overarching thesis.',
    examples: [
      {
        id: 'exp-be-that-as-it-may',
        word: 'Be that as it may',
        type: 'transition',
        phonetic: '/biː ðæt æz ɪt meɪ/',
        syllables: 'be that as it MAY',
        accents: [
          { accent: 'British', ipa: '/biː ðæt æz ɪt meɪ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/biː ðæt æz ɪt meɪ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Accepting that what was said is true, but maintaining that it does not change the core conclusion.',
                example: 'The initial costs were daunting; be that as it may, the modernization had to occur.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Diplomatically acknowledging counter-evidence while holding firm ground.'],
          formality: 'Formal',
          cefr: 'C2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'concession']
      },
      {
        id: 'exp-admittedly',
        word: 'Admittedly',
        type: 'transition',
        phonetic: '/ədˈmɪt.ɪd.li/',
        syllables: 'ad-MIT-ted-ly',
        accents: [
          { accent: 'British', ipa: '/ədˈmɪt.ɪd.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ædˈmɪt̬.ɪd.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Used when you are acknowledging a fact that might weaken your case or sound reluctant.',
                example: 'Admittedly, the preliminary prototype lacked aesthetic elegance, but its telemetry was flawless.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Demonstrating intellectual honesty by granting an undeniable shortcoming.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'concession']
      },
      {
        id: 'exp-granted-that',
        word: 'Granted that',
        type: 'transition',
        phonetic: '/ˈɡrɑːn.tɪd ðæt/',
        syllables: 'gran-ted THAT',
        accents: [
          { accent: 'British', ipa: '/ˈɡrɑːn.tɪd ðæt/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈɡræn.t̬ɪd ðæt/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Conceding the validity of a premise before establishing a qualifying caveat.',
                example: 'Granted that speed was essential, accuracy should never have been sacrificed.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Permitting a premise for the sake of argument without yielding the conclusion.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'concession']
      },
      {
        id: 'exp-albeit',
        word: 'Albeit',
        type: 'transition',
        phonetic: '/ɔːlˈbiː.ɪt/',
        syllables: 'all-BE-it',
        accents: [
          { accent: 'British', ipa: '/ɔːlˈbiː.ɪt/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɑːlˈbiː.ɪt/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Although; even though (used concisely to modify an adjective or clause).',
                example: 'The expedition reached the plateau, albeit three days behind schedule and exhausted.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Compact concession qualifying an otherwise triumphant statement.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'concession']
      }
    ]
  },
  {
    id: 'comparison',
    name: 'Comparison',
    count: 5,
    description: 'Aligning symmetries, analogies, and corresponding phenomena.',
    examples: [
      {
        id: 'exp-by-analogy',
        word: 'By analogy',
        type: 'transition',
        phonetic: '/baɪ əˈnæl.ə.dʒi/',
        syllables: 'by a-NAL-o-gy',
        accents: [
          { accent: 'British', ipa: '/baɪ əˈnæl.ə.dʒi/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/baɪ əˈnæl.ə.dʒi/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Drawing a comparison between two things that are similar in some aspects.',
                example: 'We can understand neural networks by analogy with the synaptic architecture of the brain.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Explaining complex systems by referencing familiar models.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'comparison']
      },
      {
        id: 'exp-in-parallel',
        word: 'In parallel',
        type: 'transition',
        phonetic: '/ɪn ˈpær.ə.lel/',
        syllables: 'in PA-ral-lel',
        accents: [
          { accent: 'British', ipa: '/ɪn ˈpær.ə.lel/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ɪn ˈper.ə.lel/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Occurring simultaneously or moving along corresponding trajectories.',
                example: 'In parallel with fiscal consolidation, the administration launched structural labor reforms.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Tracing simultaneous multi-track initiatives.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'comparison']
      },
      {
        id: 'exp-by-the-same-measure',
        word: 'By the same measure',
        type: 'transition',
        phonetic: '/baɪ ðə seɪm ˈmeʒ.ər/',
        syllables: 'by the same MEA-sure',
        accents: [
          { accent: 'British', ipa: '/baɪ ðə seɪm ˈmeʒ.ə/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/baɪ ðə seɪm ˈmeʒ.ɚ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Applying the identical standard, gauge, or proportionality to another case.',
                example: 'If late submissions penalize candidates, by the same measure, late grading should warrant apologies.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Enforcing fairness and ethical consistency across reciprocal parties.'],
          formality: 'Formal',
          cefr: 'C1'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'comparison']
      },
      {
        id: 'exp-equally',
        word: 'Equally',
        type: 'transition',
        phonetic: '/ˈiː.kwə.li/',
        syllables: 'E-qual-ly',
        accents: [
          { accent: 'British', ipa: '/ˈiː.kwə.li/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/ˈiː.kwə.li/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'In an equal manner; to the same degree.',
                example: 'Equally, one must ponder whether convenience outweighs security in distributed ledger systems.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Giving equal weight to a parallel counterweight idea.'],
          formality: 'Formal',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'comparison']
      },
      {
        id: 'exp-much-in-the-same-way',
        word: 'Much in the same way',
        type: 'transition',
        phonetic: '/mʌtʃ ɪn ðə seɪm weɪ/',
        syllables: 'much in the same WAY',
        accents: [
          { accent: 'British', ipa: '/mʌtʃ ɪn ðə seɪm weɪ/', flag: '🇬🇧', langCode: 'en-GB' },
          { accent: 'American', ipa: '/mʌtʃ ɪn ðə seɪm weɪ/', flag: '🇺🇸', langCode: 'en-US' }
        ],
        meanings: [
          {
            partOfSpeech: 'transition',
            definitions: [
              {
                definition: 'Highlighting an intuitive similarity between two distinct phenomena.',
                example: 'Much in the same way that trees communicate through fungal roots, distributed networks coordinate quietly.'
              }
            ]
          }
        ],
        nuance: {
          bestUsedWhen: ['Crafting elegant, accessible analogies in speeches and essays.'],
          formality: 'Neutral',
          cefr: 'B2'
        },
        dateAdded: '2026-11-09T00:00:00.000Z',
        tags: ['transition', 'comparison']
      }
    ]
  }
];
