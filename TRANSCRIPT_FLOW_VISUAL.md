# Visual Transcript Formatting Flow

## Complete Processing Pipeline

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    TRANSCRIPT FORMATTING PIPELINE           │
                    └─────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   RAW AUDIO │───▶│ AWS TRANSCRIBE│───▶│RAW TRANSCRIPT│───▶│MODE PROCESSING│
│   INPUT     │    │ (Speech-to-Text)│    │(Plain Text) │    │    LAYER     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    MODE PROCESSING LAYER                    │
                    ├─────────────────────────────────────────────────────────────┤
                    │                                                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
                    │  │   MODE 1    │  │   MODE 2    │  │   MODE 3    │        │
                    │  │Word-for-Word│  │Smart Dictation│  │   Ambient   │        │
                    │  │             │  │             │  │             │        │
                    │  │• No AI      │  │• Voice cmds │  │• Auto-punct │        │
                    │  │• Raw text   │  │• Verbatim   │  │• AWS handles│        │
                    │  │• Preserve   │  │• Real-time  │  │• Minimal    │        │
                    │  └─────────────┘  └─────────────┘  └─────────────┘        │
                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                  TEMPLATE SELECTION LAYER                   │
                    ├─────────────────────────────────────────────────────────────┤
                    │                                                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
                    │  │  SECTION 7  │  │  SECTION 8  │  │  SECTION 11 │        │
                    │  │(Identification)│  │(Antécédents)│  │  (Examen)   │        │
                    │  │             │  │             │  │             │        │
                    │  │• All modes  │  │• All modes  │  │• All modes  │        │
                    │  │• All tmpls  │  │• All tmpls  │  │• All tmpls  │        │
                    │  └─────────────┘  └─────────────┘  └─────────────┘        │
                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                  TEMPLATE PROCESSING LAYER                  │
                    ├─────────────────────────────────────────────────────────────┤
                    │                                                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
                    │  │ TEMPLATE 1  │  │ TEMPLATE 2  │  │ TEMPLATE 3  │        │
                    │  │Word-for-Word│  │AI Formatter │  │AI+Verbatim  │        │
                    │  │  Formatter  │  │   Basic     │  │             │        │
                    │  │             │  │             │  │             │        │
                    │  │• No AI      │  │• AI format  │  │• AI format  │        │
                    │  │• Basic      │  │• Medical    │  │• Verbatim   │        │
                    │  │• Preserve   │  │• CNESST     │  │• Protection │        │
                    │  └─────────────┘  └─────────────┘  └─────────────┘        │
                    │                                                             │
                    │  ┌─────────────┐  ┌─────────────┐                         │
                    │  │ TEMPLATE 4  │  │ TEMPLATE 5  │                         │
                    │  │AI+Verbatim  │  │AI+Verbatim  │                         │
                    │  │+Voice Cmds  │  │+Voice Cmds  │                         │
                    │  │             │  │   (Full)    │                         │
                    │  │• All feat   │  │• Complete   │                         │
                    │  │• Voice cmds │  │• Processing │                         │
                    │  │• Verbatim   │  │             │                         │
                    │  └─────────────┘  └─────────────┘                         │
                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    AI PROCESSING LAYER                      │
                    ├─────────────────────────────────────────────────────────────┤
                    │                                                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
                    │  │  VERBATIM   │  │  VOICE      │  │     AI      │        │
                    │  │ PROTECTION  │  │ COMMANDS    │  │ FORMATTING  │        │
                    │  │             │  │ PROCESSING  │  │   ENGINE    │        │
                    │  │• Detect     │  │• Parse      │  │• Medical    │        │
                    │  │  markers    │  │  commands   │  │  terms      │        │
                    │  │• Protect    │  │• Apply      │  │• CNESST     │        │
                    │  │  text       │  │  macros     │  │  format     │        │
                    │  │• Skip AI    │  │• Insert     │  │• Structure  │        │
                    │  └─────────────┘  └─────────────┘  └─────────────┘        │
                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                  OUTPUT GENERATION LAYER                    │
                    ├─────────────────────────────────────────────────────────────┤
                    │                                                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
                    │  │ FORMATTED   │  │ VALIDATION  │  │ FINAL OUTPUT│        │
                    │  │ TRANSCRIPT  │  │   LAYER     │  │             │        │
                    │  │             │  │             │  │             │        │
                    │  │• Medical    │  │• CNESST     │  │• Ready for  │        │
                    │  │  terms      │  │  rules      │  │  export     │        │
                    │  │• Proper     │  │• Medical    │  │• PDF/Word   │        │
                    │  │  format     │  │  compliance │  │             │        │
                    │  │• Structure  │  │             │  │             │        │
                    │  └─────────────┘  └─────────────┘  └─────────────┘        │
                    └─────────────────────────────────────────────────────────────┘
```

## Processing Example Flow

```
INPUT: "The patient said open parenthesis I have diabetes close parenthesis new paragraph blood pressure is high"

                    ▼
            ┌─────────────────┐
            │   MODE 2        │
            │ Smart Dictation │
            │                 │
            │• Detects voice  │
            │  commands       │
            │• Detects        │
            │  verbatim       │
            │  markers        │
            └─────────────────┘
                    ▼
            ┌─────────────────┐
            │   TEMPLATE 4    │
            │AI+Verbatim      │
            │+Voice Commands  │
            │                 │
            │• Applies AI     │
            │  formatting     │
            │• Protects       │
            │  verbatim text  │
            │• Processes      │
            │  voice commands │
            └─────────────────┘
                    ▼
            ┌─────────────────┐
            │   AI PROCESSING │
            │                 │
            │• Verbatim:      │
            │  "(I have       │
            │   diabetes)"    │
            │• Voice Command: │
            │  "new paragraph"│
            │• AI Formatting: │
            │  "blood pressure│
            │   is elevated"  │
            └─────────────────┘
                    ▼
            ┌─────────────────┐
            │   FINAL OUTPUT  │
            │                 │
            │"The patient said│
            │(I have diabetes)│
            │                 │
            │Blood pressure is│
            │elevated"        │
            └─────────────────┘
```

## Key Processing Features

### 1. **Verbatim Protection**
- Detects `___VERBATIM_START___` markers
- Protects text from AI modification
- Preserves exact spoken words

### 2. **Voice Commands**
- "new paragraph" → Line break
- "bold text" → **Bold formatting**
- "italic text" → *Italic formatting*
- "open parenthesis" → (
- "close parenthesis" → )

### 3. **AI Formatting**
- Medical terminology conversion
- CNESST compliance formatting
- Proper medical report structure
- Chronological organization

### 4. **Template Combinations**
- **Basic**: No AI, basic structure
- **AI**: Medical formatting
- **AI + Verbatim**: Protected text + formatting
- **AI + Verbatim + Voice**: Full feature set

This pipeline ensures that medical transcripts are properly formatted while preserving the integrity of verbatim text and supporting voice commands for efficient dictation.
