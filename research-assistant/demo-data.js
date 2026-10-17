window.DEMO_DATA = {
  title: 'Retrieval-Augmented Generation: A Reading Primer',
  titleZh: '检索增强生成：一份入门阅读指南',
  subtitle: '原创教学示例 · 非真实发表论文 · 不含实际实验结果',
  sections: [
    {
      id: 'abstract',
      label: '摘要',
      eyebrow: '01 / ABSTRACT',
      title: 'A question, a source, and an answer',
      paragraphs: [
        {
          id: 'abstract-1',
          text: 'Retrieval-augmented generation (RAG) combines information retrieval with language generation. Instead of relying only on what a model learned during training, a system first searches a collection of documents for passages related to a question. It then gives those passages, together with the question, to a language model. The model uses this context to compose an answer. This reading primer explains the process through a conceptual example, rather than reporting an experiment.',
          translation: '检索增强生成（RAG）将信息检索与语言生成结合起来。系统首先在文档集合中搜索与问题相关的段落，从而补充模型在训练期间学到的知识。随后，它将这些段落连同问题一起提供给语言模型，由模型利用这些上下文组织答案。这份入门指南通过概念性示例解释这一过程，并不报告实际实验。'
        },
        {
          id: 'abstract-2',
          text: 'Consider a student asking why a paper uses a particular evaluation metric. A useful assistant should locate the relevant discussion, read any nearby definitions, and explain how the metric relates to the research goal. It should also point back to the source. However, a passage that mentions the metric may not explain the authors’ motivation. In that case, the assistant should identify the missing evidence instead of presenting an inference as a stated fact.',
          translation: '设想一名学生在问：一篇论文为什么使用某个评价指标？有帮助的助手应当找到相关论述，阅读附近的定义，并解释该指标与研究目标的关系，同时提供返回来源的入口。不过，提到这个指标的段落未必解释了作者的选择动机。此时，助手应当指出证据缺失，而不能把自己的推断当作原文已明确陈述的事实。'
        }
      ],
      takeaway: 'RAG 先寻找资料，再利用资料组织回答；补充了上下文，并不自动保证结论正确。'
    },
    {
      id: 'method',
      label: '方法',
      eyebrow: '02 / METHOD',
      title: 'Retrieve first. Generate with context.',
      paragraphs: [
        {
          id: 'method-1',
          text: 'A document can be divided into smaller units called chunks. Each chunk keeps its text and source location, such as a page or paragraph identifier. For a new question, a retriever ranks these chunks by estimated relevance. The top-k setting determines how many of the highest-ranked chunks are selected. Increasing k provides more material, but it can also introduce distracting passages and consume the model’s limited context space. A larger value is therefore not automatically better.',
          translation: '文档可以被划分为较小的内容块，每个内容块保留正文和来源位置，例如页码或段落编号。面对一个新问题，检索器按照估计的相关程度对这些内容块排序。top-k 参数决定选取排名最高的多少个内容块。增大 k 会提供更多材料，但也可能引入干扰段落，并占用模型有限的上下文空间，因此数值更大并不一定更好。'
        },
        {
          id: 'method-2',
          text: 'The generator receives the question and the selected chunks. Its task is to form an understandable answer while respecting what the evidence actually says. A source identifier can be attached to each supported claim, allowing the interface to open the original passage. If essential definitions are missing, the system may retrieve again before answering. This creates a simple agent workflow: inspect the question, choose a retrieval action, examine the result, and decide whether enough evidence is available.',
          translation: '生成器接收问题和选中的内容块，其任务是在遵循证据实际含义的基础上形成易于理解的回答。每条有依据的陈述可以附上来源编号，界面据此打开原始段落。如果缺少重要定义，系统可以在回答前再次检索。这就形成了一个简单的 Agent 工作流程：检查问题、选择检索动作、查看结果，再判断现有证据是否充分。'
        }
      ],
      takeaway: '检索负责寻找相关内容，生成负责组织解释；Agent 可以依据检索结果决定是否继续查找。'
    },
    {
      id: 'evidence',
      label: '证据',
      eyebrow: '03 / EVIDENCE',
      title: 'A citation is a place to check',
      paragraphs: [
        {
          id: 'evidence-1',
          text: 'Citation location and factual correctness are different properties. A working citation confirms that a reader can open a particular source passage. It does not establish that the passage supports the answer, that the answer preserves important conditions, or that the source itself is correct. For example, a claim about one dataset should not become a statement about every application. Evidence checking therefore requires reading both the generated claim and the cited passage in context.',
          translation: '引文定位与事实正确是两种不同的属性。一个有效的引用链接只能确认读者可以打开某处来源，不能证明该段落支持答案、答案保留了重要条件，或来源本身正确。例如，针对一个数据集的结论不应被扩展成适用于所有应用的说法。因此，核查证据需要结合上下文，同时阅读生成的陈述与被引用的原文。'
        },
        {
          id: 'evidence-2',
          text: 'A small evaluation can separate several questions: Did retrieval find useful passages? Did the answer accurately reflect those passages? Could the student explain the concept afterward? These questions require different checks. Reviewers can inspect a fixed set of question-and-source pairs, while students can answer a new comprehension question after reading. The present document supplies no measurements, participants, or experimental outcomes. It proposes a way to evaluate a learning assistant, not evidence that a particular assistant improves learning.',
          translation: '一次小规模评估可以分别考察：检索是否找到了有用的段落？回答是否准确反映了这些段落？学生阅读后能否解释相关概念？这些问题需要不同的检查方式。审核者可以检查一组固定的问题与来源配对，学生则可以在阅读后回答一道新的理解题。本文未提供测量数据、参与者或实验结果，只提出一种评估学习助手的方法，并不能证明某个助手改善了学习效果。'
        }
      ],
      takeaway: '点击引用只能完成定位；核对结论、条件与原文的一致性，才是在检查证据。'
    },
    {
      id: 'limits',
      label: '局限',
      eyebrow: '04 / LIMITATIONS',
      title: 'Know what the sources cannot tell you',
      paragraphs: [
        {
          id: 'limits-1',
          text: 'Retrieval can fail when the collection lacks the needed information, a document is parsed incorrectly, or the question uses different terminology from the source. Formula symbols, table structure, and nearby qualifiers may be lost during text extraction. A system should preserve access to the original page and acknowledge unresolved ambiguity. When a student asks about a figure, reading only its caption may miss relationships that are visible in the image itself.',
          translation: '当资料库缺少所需信息、文档解析错误，或问题与来源使用不同术语时，检索可能失败。文字提取还可能丢失公式符号、表格结构以及附近的限定条件。系统应保留访问原始页面的入口，并承认尚未消除的歧义。学生询问图中的内容时，只阅读图注可能会遗漏图像本身呈现的关系。'
        },
        {
          id: 'limits-2',
          text: 'A learning assistant also needs to distinguish explanation from assessment. A fluent answer may feel clear even when a learner still holds a misconception. An optional follow-up question can reveal part of that gap, but one correct response is not proof of lasting understanding. Progress records should describe observed interactions rather than assign permanent ability labels. For unfamiliar or unsupported topics, the assistant should state what remains uncertain and suggest a concrete next source or question.',
          translation: '学习助手还需要区分讲解与评估。流畅的回答可能让人感觉清楚，即使学习者仍然存在误解。可选的后续问题能够揭示部分理解缺口，但一次回答正确并不能证明已经形成持久理解。学习记录应描述观察到的互动，而不应给学生贴上固定能力标签。面对陌生或缺乏依据的主题，助手应说明仍有哪些不确定之处，并提出具体的后续资料或问题。'
        }
      ],
      takeaway: '资料完整性、解析质量和学生的真实理解都需要单独检查；一次正确回答不能代表永久掌握。'
    }
  ],
  glossary: [
    { term: 'RAG', zh: '检索增强生成', definition: '先从资料中检索相关内容，再将这些内容交给语言模型，用于组织回答。' },
    { term: 'Retrieval', zh: '检索', definition: '从资料集合中查找并排序与当前问题相关的内容。相关性高不等于内容一定能支持结论。' },
    { term: 'Generation', zh: '生成', definition: '语言模型根据问题及上下文组织答案的过程，仍可能误读或遗漏条件。' },
    { term: 'Chunk', zh: '内容块', definition: '用于检索的一小段文档内容，应同时保留来源位置，方便返回原文核验。' },
    { term: 'Top-k', zh: '选取排名前 k 项', definition: '选取相关性排序最高的 k 个内容块。k 更大可能引入更多干扰，并非越大越好。' },
    { term: 'Evidence citation', zh: '证据引用', definition: '将回答中的陈述关联到可查看的来源。能够定位原文，不代表该原文充分支持陈述。' }
  ],
  responses: {
    overview: {
      title: '先抓住这篇材料的主线',
      paragraphs: [
        '这是一份 RAG 入门教学材料，不是真实发表的研究论文。它解释了一个问题：怎样让科研助手利用给定资料回答，并让学生有机会核验答案。',
        '核心过程是“提出问题 → 检索相关段落 → 基于段落组织解释 → 返回证据位置”。如果重要定义没有找到，Agent 可以继续检索。',
        '阅读时先区分检索与生成，再看引文如何帮助核验。本文没有实验数据，因此不能据此声称 RAG 一定提高学习效果。'
      ],
      citation: { section: 'abstract', paragraph: 'abstract-1', label: '摘要 · 第 1 段' },
      followup: '检索和生成分别负责什么？'
    },
    retrieval: {
      title: '检索找资料，生成组织解释',
      paragraphs: [
        '检索可以理解为在资料里寻找与问题相关的段落；生成则是模型在读过这些段落后，把信息组织成易懂的回答。两步分别影响“有没有找到证据”和“有没有把证据解释准确”。',
        'top-k 中的 k 是选取的内容块数量。例如 k = 3 表示选取相关性排名最高的 3 个块，不代表答案有 3 条证据，也不代表这 3 个块一定足够。',
        'k 增大可能补充重要上下文，也可能带入无关内容。需要根据具体问题检查检索结果，而不是简单地把 k 调到最大。'
      ],
      citation: { section: 'method', paragraph: 'method-1', label: '方法 · 第 1 段' },
      followup: '引用能证明答案正确吗？'
    },
    translation: {
      title: '把术语放回句子里理解',
      paragraphs: [
        'Retrieval-augmented generation 可以译为“检索增强生成”。其中 retrieval 是“检索”，generation 是“生成”，augmented 表示通过检索到的资料补充生成时的上下文。',
        '“The model uses this context to compose an answer.” 可译为“模型利用这些上下文组织答案”。这里的 context 指系统提供的问题及相关段落，不是模型已经验证过的事实集合。',
        '可以打开“对照翻译”，逐段查看完整译文。遇到公式、限定词或不清楚的术语时，应同时核对英文原文。'
      ],
      citation: { section: 'abstract', paragraph: 'abstract-1', label: '摘要 · 第 1 段' },
      followup: '先帮我梳理这篇材料的主线'
    },
    limitations: {
      title: '这份材料明确了哪些边界？',
      paragraphs: [
        '第一，资料库可能根本没有答案；第二，PDF 解析可能丢失公式、表格和限定条件；第三，检索可能找错段落。生成流畅的答案无法自动解决这些问题。',
        '读论文时可以采用一个简单习惯：关键结论返回原文，关键公式查看原始页面，缺少的前提先标记为待核实。',
        '这是一份概念性教学示例，没有实际实验结果。理解检查也只能观察本次回答，不能据一次答对就判断学生已经长期掌握。'
      ],
      citation: { section: 'limits', paragraph: 'limits-1', label: '局限 · 第 1 段' },
      followup: '引用能证明答案正确吗？'
    },
    citation: {
      title: '能定位原文，还需要检查是否支持结论',
      paragraphs: [
        '不能仅凭引用判断答案正确。链接有效只说明你能打开那段原文；还需要检查原文是否支持回答、回答是否保留条件，以及来源本身是否可靠。',
        '例如，原文只讨论一个数据集，回答却说“适用于所有任务”，即使引用位置正确，结论也超出了证据范围。',
        '点击下方来源，核对本文对“引文定位”和“事实正确”的区分。读书卡中的关键陈述也应按同样方式核验。'
      ],
      citation: { section: 'evidence', paragraph: 'evidence-1', label: '证据 · 第 1 段' },
      followup: '我想检查一下自己是否理解了'
    }
  },
  quiz: {
    question: '助手的引用链接能准确打开原文。你能据此确定什么？',
    options: [
      '答案一定正确，因为已经附上原文。',
      '来源位置可以核查，但还要确认原文是否支持回答。',
      '学生已经理解了原文涉及的概念。'
    ],
    correctIndex: 1,
    explanation: '引用定位提供核验入口。答案是否准确、是否保留限定条件，以及学生是否理解，都需要另外检查。可以回看“证据”第 1 段。'
  },
  readingCard: {
    problem: '如何让科研初学者获得有资料依据、能够返回原文核验的解释？本材料用于介绍 RAG 的基本过程。',
    method: '文档分块并保留来源位置；检索与问题相关的 top-k 内容块；模型基于这些内容组织回答；证据不足时继续查找。',
    evidence: '本文是原创概念性教学示例，没有实际实验数据或效果结论。它提出分别检查检索相关性、回答与证据的一致性，以及学生理解情况。',
    limitations: '资料缺失、解析错误、检索偏差和生成误读都可能影响回答。引用位置正确不代表事实正确；一次理解题答对也不代表长期掌握。',
    questions: '怎样判断检索结果已足够？如何保留公式附近的定义与条件？怎样设计一道能发现误解的理解题？'
  }
};
