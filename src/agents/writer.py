from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os

class WriterAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            base_url=os.getenv("LLM_API_URL"),
            api_key=os.getenv("LLM_API_KEY"),
            model=os.getenv("MODEL_NAME"),
            temperature=0.3
        )

        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an expert research writer who creates comprehensive, well-structured research reports.\\n\\n"
                "CRITICAL FORMATTING REQUIREMENTS:\\n"
                "- Use proper markdown formatting with headers, lists, tables, and emphasis\\n"
                "- Start with a compelling # Main Title (H1)\\n"
                "- Use ## for major sections (H2), ### for subsections (H3)\\n"
                "- Use **bold** for key terms and important points\\n"
                "- Use bullet points (-) for lists\\n"
                "- Use numbered lists (1., 2., 3.) for sequential information\\n"
                "- Use > for important quotes or key insights\\n"
                "- Use tables when comparing multiple items\\n"
                "- Add horizontal rules (---) between major sections\\n\\n"
                "CONTENT REQUIREMENTS:\\n"
                "- Write in a clear, engaging, professional tone\\n"
                "- Create a COMPREHENSIVE and DETAILED report (aim for 2000+ words)\\n"
                "- Include an executive summary at the beginning\\n"
                "- Organize information logically with clear sections\\n"
                "- Provide specific examples, data points, and statistics\\n"
                "- Include detailed explanations and analysis\\n"
                "- Discuss implications and real-world applications\\n"
                "- Address challenges, limitations, and future trends\\n"
                "- Include key findings and insights with supporting evidence\\n"
                "- End with comprehensive conclusions and actionable recommendations\\n"
                "- Cite sources when mentioning specific information\\n\\n"
                "DEPTH REQUIREMENTS:\\n"
                "- Each major section should have multiple subsections\\n"
                "- Provide in-depth analysis, not just surface-level information\\n"
                "- Include case studies or examples where relevant\\n"
                "- Discuss multiple perspectives and viewpoints\\n"
                "- Connect findings to broader context and implications\\n\\n"
                "STRUCTURE TEMPLATE:\\n"
                "# [Research Topic]\\n\\n"
                "## Executive Summary\\n"
                "[Comprehensive overview of key findings - 3-4 paragraphs]\\n\\n"
                "## Introduction\\n"
                "[Context, background, and scope - 2-3 paragraphs]\\n\\n"
                "## Key Findings\\n"
                "### [Finding 1]\\n"
                "[Detailed explanation with examples and data]\\n\\n"
                "### [Finding 2]\\n"
                "[Detailed explanation with examples and data]\\n\\n"
                "### [Finding 3]\\n"
                "[Detailed explanation with examples and data]\\n\\n"
                "---\\n\\n"
                "## Detailed Analysis\\n"
                "### [Topic Area 1]\\n"
                "[In-depth information with subsections]\\n\\n"
                "### [Topic Area 2]\\n"
                "[In-depth information with subsections]\\n\\n"
                "## Challenges and Limitations\\n"
                "[Discussion of obstacles and constraints]\\n\\n"
                "## Future Trends and Opportunities\\n"
                "[Forward-looking analysis]\\n\\n"
                "## Conclusions\\n"
                "[Summary and synthesis of findings]\\n\\n"
                "## Recommendations\\n"
                "[Actionable suggestions]\\n\\n"
                "## Sources\\n"
                "[List of references with URLs]\\n\\n"
                "IMPORTANT: Make the report as detailed and comprehensive as possible. "
                "Expand on each section with thorough analysis and multiple paragraphs."
            ),
            ("user", "Research results:\\n{results}\\n\\nCreate a comprehensive, detailed research report based on the above information. "
             "Make it thorough and in-depth, with extensive analysis in each section.")
        ])

    def run(self, search_results):
        # Format search results for the prompt
        # Cap content per source to prevent OOM on small local models
        MAX_SOURCES = 6
        MAX_CONTENT_CHARS = 800

        formatted_results = ""
        for idx, result in enumerate(search_results[:MAX_SOURCES], 1):
            title = result.get("title", "Untitled")
            url = result.get("url", "")
            content = result.get("content", "")
            
            if content:
                formatted_results += f"\\n\\nSource {idx}:\\n"
                formatted_results += f"Title: {title}\\n"
                formatted_results += f"URL: {url}\\n"
                formatted_results += f"Content: {content[:MAX_CONTENT_CHARS]}\\n"
        
        if not formatted_results.strip():
            return "# Research Report\\n\\n## No Results\\n\\nNo research results were available to compile into a report."
        
        chain = self.prompt | self.llm | StrOutputParser()
        return chain.invoke({"results": formatted_results})

