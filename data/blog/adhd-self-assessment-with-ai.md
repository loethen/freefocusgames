---
title: "How to Use an AI for a Preliminary ADHD Self-Assessment"
excerpt: "Learn how to use a large language model with the Vanderbilt ADHD Diagnostic Rating Scale to conduct a preliminary self-assessment for ADHD. This guide provides a detailed prompt to help you get started."
date: "2025-07-17"
updatedAt: "2026-10-23"
coverImage: "/adhd-test-llm-cover.jpg"
author:
  name: "FreeFocusGames Team"
  picture: "/authors/team.png"
tags: ["ADHD", "AI", "Self-Assessment", "Mental Health", "Vanderbilt Scale"]
keywords: ["vanderbilt adhd rating scale", "vanderbilt scale adhd", "scoring the vanderbilt adhd rating scale", "adhd self-test", "ai mental health", "adhd rs iv scale", "child adhd self-report scale", "adhd self report scale", "adult adhd self report scale"]
---

In the age of artificial intelligence, large language models (LLMs) can be powerful tools for organizing information and even guiding users through complex questionnaires. One such application is conducting a preliminary self-assessment for Attention-Deficit/Hyperactivity Disorder (ADHD) using established diagnostic tools like the **Vanderbilt ADHD Diagnostic Rating Scale**.

This article will explain how you can use an LLM to walk through the parent version of the Vanderbilt scale. We provide a detailed prompt that you can use with your preferred AI assistant.

**Disclaimer:** This process is for informational and organizational purposes only. It does not provide a medical diagnosis. The results from the **Vanderbilt ADHD Rating Scale** are a reference and should not replace a consultation with a qualified healthcare professional.

**Who this is for:** The Vanderbilt parent scale is designed for children aged about 6–12 and is completed by a parent or caregiver. For adults, use the [adult ADHD ASRS screener](/adult-adhd-assessment) instead. If you would rather not use an AI chatbot, our free [children's ADHD assessment](/adhd-assessment) applies the same scoring rules for you.

**Privacy tip:** Do not share your child's full name, school, or other identifying details with an AI service.

### What is the Vanderbilt ADHD Rating Scale?

The **Vanderbilt ADHD Diagnostic Rating Scale** is a widely used assessment tool for ADHD. The parent version is filled out by parents based on their child's daily behaviors. It covers multiple dimensions, including inattention, hyperactivity, and impulsivity, offering a comprehensive overview of the subject's behavior. Understanding how to approach **scoring the Vanderbilt ADHD Rating Scale** can provide valuable insights, but a professional's interpretation is crucial.

If your main goal is to understand the actual scoring logic before using AI to organize answers, read our dedicated guide on [scoring the Vanderbilt ADHD Rating Scale](/blog/scoring-the-vanderbilt-adhd-rating-scale). It explains how symptom counts, impairment items, parent forms, and teacher forms are interpreted.

### The Prompt for the AI Model

You can copy and paste the following prompt into an AI chat interface like ChatGPT, Gemini, or Claude. The model will then guide you through the questionnaire.

#### **English Prompt**

---

The Vanderbilt ADHD Diagnostic Rating Scale is a tool widely used to assess Attention-Deficit/Hyperactivity Disorder (ADHD). The parent version is primarily completed by parents based on their child's daily behavior. The scale includes questions across multiple dimensions to provide a comprehensive view of the subject's performance in areas like inattention, hyperactivity, and impulsivity. However, the results are for reference only and do not constitute a medical diagnosis.

You are to act as a professional interview assistant, guiding the user through a questionnaire based on the "Vanderbilt ADHD Diagnostic Rating Scale (Parent Version)." Here are the specific task flow and requirements:

1.  **Opening Statement**: First, introduce yourself in one sentence and emphasize that this process is for informational purposes only and does not constitute a medical diagnosis.
2.  **Ask for Basic Information**: Next, proactively ask the user for basic information for the assessment. Confirm that the assessment is about a child aged 6–12 and ask for the child's age. If the user wants to assess an adult, explain that this scale is designed for children and suggest the Adult ADHD Self-Report Scale (ASRS) instead.
3.  **Wait for User's Response**: Wait for the user to answer the two questions above before proceeding.
4.  **Begin the Questionnaire**: Starting with the "Inattention" section, ask the user the questions from the scale one by one. For each question, you must include the rating scale: "0=Never, 1=Occasionally, 2=Often, 3=Very Often".

    Below are the questions from the Vanderbilt ADHD Diagnostic Rating Scale (Parent Version):
    <scale_questions>
    
    **Inattention**

    1. Fails to give close attention to details or makes careless mistakes in schoolwork.
    2. Has difficulty sustaining attention in tasks or play activities.
    3. Does not seem to listen when spoken to directly.
    4. Does not follow through on instructions and fails to finish schoolwork, chores, or duties in the workplace.
    5. Has difficulty organizing tasks and activities.
    6. Avoids, dislikes, or is reluctant to engage in tasks that require sustained mental effort.
    7. Loses things necessary for tasks or activities (e.g., toys, school assignments, pencils, books).
    8. Is easily distracted by extraneous stimuli.
    9. Is forgetful in daily activities.

    **Hyperactivity/Impulsivity**

    10. Fidgets with hands or feet or squirms in seat.
    11. Leaves seat in classroom or in other situations in which remaining seated is expected.
    12. Runs about or climbs excessively in situations in which it is inappropriate.
    13. Has difficulty playing or engaging in leisure activities quietly.
    14. Is "on the go" or often acts as if "driven by a motor."
    15. Talks excessively.
    16. Blurts out answers before questions have been completed.
    17. Has difficulty awaiting turn.
    18. Interrupts or intrudes on others (e.g., butts into conversations or games).
    </scale_questions>
5.  **Record and Summarize**: After the user has answered all the core questions, organize all of their responses into a clear, categorized list titled "Vanderbilt Scale Behavioral Observation Record." At the beginning of the summary, include the subject and age information provided by the user earlier.
6.  **Provide Summary and Recommendations**: After completing the record summary, you must provide an objective summary and recommendations based on the content. Count how many of questions 1-9 and how many of questions 10-18 were rated 2 or 3, and report both counts. Explain that clinicians treat 6 or more in either group as a screening threshold only when there is also impairment at home or school, and recommend discussing the results with a pediatrician or other qualified professional. Do not state or imply a diagnosis. Please output the summary and recommendations within `<summary_recommendations>` tags.

Now, please begin your task.

---

By using this structured prompt, you can leverage an LLM to systematically go through the **Vanderbilt Scale for ADHD**, making the initial step of gathering information more organized. Remember, this is a starting point, and professional medical advice is essential for a proper diagnosis.

### Practice Attention with These Games

Brain games are not a treatment for ADHD, but they can be a fun way to practice attention skills. Here are a few games on our site:

*   **[Dual N-Back](/games/dual-n-back)**: A classic task for practicing working memory and divided attention.
*   **[Schulte Table](/games/schulte-table)**: A timed visual search task for practicing focused attention.
*   **[Stroop Effect Test](/games/stroop-effect-test)**: This game challenges your selective attention and cognitive flexibility by forcing you to resolve conflicting information.
*   **[Reaction Time Test](/games/reaction-time)**: Measure how quickly and consistently you respond to visual cues.
