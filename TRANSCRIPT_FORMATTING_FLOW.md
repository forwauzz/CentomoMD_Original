# Transcript Formatting Pipeline - High Level Flow

## Overview
Our system processes raw transcripts through multiple layers to produce formatted medical reports. Here's the complete flow:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRANSCRIPT FORMATTING PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RAW AUDIO     │───▶│   AWS TRANSCRIBE│───▶│  RAW TRANSCRIPT │───▶│  MODE PROCESSING│
│   INPUT         │    │   (Speech-to-   │    │   (Plain Text)  │    │   LAYER         │
│                 │    │    Text)        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MODE PROCESSING LAYER                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   MODE 1        │  │   MODE 2        │  │   MODE 3        │                │
│  │   Word-for-Word │  │   Smart Dictation│  │   Ambient       │                │
│  │                 │  │                 │  │                 │                │
│  │ • No processing │  │ • Voice commands│  │ • Auto-punctuation│              │
│  │ • Raw text      │  │ • Verbatim      │  │ • AWS handles   │                │
│  │ • Preserve all  │  │ • Real-time     │  │ • Minimal       │                │
│  │   spoken words  │  │   conversion    │  │   processing    │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TEMPLATE SELECTION LAYER                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   SECTION 7     │  │   SECTION 8     │  │   SECTION 11    │                │
│  │   (Identification)│  │   (Antécédents)│  │   (Examen)      │                │
│  │                 │  │                 │  │                 │                │
│  │ Compatible with:│  │ Compatible with:│  │ Compatible with:│                │
│  │ • All modes     │  │ • All modes     │  │ • All modes     │                │
│  │ • All templates │  │ • All templates │  │ • All templates │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TEMPLATE PROCESSING LAYER                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   TEMPLATE 1    │  │   TEMPLATE 2    │  │   TEMPLATE 3    │                │
│  │   Word-for-Word │  │   AI Formatter  │  │   AI + Verbatim │                │
│  │   Formatter     │  │   Basic         │  │                 │                │
│  │                 │  │                 │  │                 │                │
│  │ • No AI         │  │ • AI formatting │  │ • AI formatting │                │
│  │ • Basic structure│  │ • Medical terms │  │ • Verbatim      │                │
│  │ • Preserve text │  │ • CNESST format │  │   protection    │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                                     │
│  │   TEMPLATE 4    │  │   TEMPLATE 5    │                                     │
│  │   AI + Verbatim │  │   AI + Verbatim │                                     │
│  │   + Voice Cmds  │  │   + Voice Cmds  │                                     │
│  │                 │  │   (Full)        │                                     │
│  │ • All features  │  │ • All features  │                                     │
│  │ • Voice commands│  │ • Complete      │                                     │
│  │ • Verbatim      │  │   processing    │                                     │
│  └─────────────────┘  └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AI PROCESSING LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   VERBATIM      │  │   VOICE COMMANDS│  │   AI FORMATTING │                │
│  │   PROTECTION    │  │   PROCESSING    │  │   ENGINE        │                │
│  │                 │  │                 │  │                 │                │
│  │ • Detect markers│  │ • Parse commands│  │ • Medical terms │                │
│  │ • Protect text  │  │ • Apply macros  │  │ • CNESST format │                │
│  │ • Skip AI       │  │ • Insert text   │  │ • Structure     │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            OUTPUT GENERATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   FORMATTED     │  │   VALIDATION    │  │   FINAL OUTPUT  │                │
│  │   TRANSCRIPT    │  │   LAYER         │  │                 │                │
│  │                 │  │                 │  │                 │                │
│  │ • Medical terms │  │ • CNESST rules  │  │ • Ready for     │                │
│  │ • Proper format │  │ • Medical       │  │   export        │                │
│  │ • Structure     │  │   compliance    │  │ • PDF/Word      │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Layer Breakdown

### 1. **INPUT LAYER**
- **Raw Audio**: Microphone input from user
- **AWS Transcribe**: Converts speech to text
- **Raw Transcript**: Plain text output

### 2. **MODE PROCESSING LAYER**
- **Mode 1 (Word-for-Word)**: No processing, preserves all spoken words
- **Mode 2 (Smart Dictation)**: Processes voice commands and verbatim markers
- **Mode 3 (Ambient)**: AWS handles punctuation, minimal processing

### 3. **TEMPLATE SELECTION LAYER**
- **Section-based**: Different templates for different medical sections
- **Compatibility**: Each template works with specific modes and sections
- **Language Support**: Templates available in French and English

### 4. **TEMPLATE PROCESSING LAYER**
- **Template 1**: Basic formatting, no AI
- **Template 2**: AI formatting with medical terminology
- **Template 3**: AI + verbatim text protection
- **Template 4**: AI + verbatim + voice commands
- **Template 5**: Full feature set (AI + verbatim + voice commands)

### 5. **AI PROCESSING LAYER**
- **Verbatim Protection**: Detects `___VERBATIM_START___` markers and protects text
- **Voice Commands**: Processes spoken commands like "new paragraph", "bold text"
- **AI Formatting**: Applies medical terminology, CNESST formatting, structure

### 6. **OUTPUT GENERATION LAYER**
- **Formatted Transcript**: Final processed text
- **Validation**: Ensures compliance with medical standards
- **Export Ready**: Formatted for PDF, Word, or other formats

## Key Features

### **Verbatim Protection**
```
Raw: "The patient said open parenthesis I don't feel well close parenthesis"
Processed: "The patient said (I don't feel well)"
```

### **Voice Commands**
```
Raw: "The diagnosis is new paragraph diabetes"
Processed: "The diagnosis is\n\ndiabetes"
```

### **AI Formatting**
```
Raw: "Patient has high blood pressure"
Processed: "Patient presents with hypertension"
```

### **Template Combinations**
- **Section 7 Only**: Basic AI formatting
- **Section 7 + Verbatim**: AI formatting with verbatim protection
- **Section 7 + Verbatim + Voice Commands**: Full feature set

## Processing Flow Example

1. **Input**: "The patient said open parenthesis I have diabetes close parenthesis new paragraph blood pressure is high"

2. **Mode 2 Processing**: Detects voice commands and verbatim markers

3. **Template 4 Processing**: Applies AI formatting while protecting verbatim text

4. **Output**: "The patient said (I have diabetes)\n\nBlood pressure is elevated"

This pipeline ensures that medical transcripts are properly formatted while preserving the integrity of verbatim text and supporting voice commands for efficient dictation.
