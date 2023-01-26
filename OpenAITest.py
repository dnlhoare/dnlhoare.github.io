import os
import openai
import json

openai.api_key = "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"#os.getenv("OPENAI_API_KEY")

modelMaxTokens = {
    "text-ada-001": 2049,
    "text-davinci-003": 4097
}

currentModel = "text-ada-001"

def ChatGPTQuery(queryIn,maxTokensIn=2000):    
    response = openai.Completion.create(
    model=currentModel,#"text-ada-001",#"text-davinci-003",
    prompt=queryIn,
    temperature=0,
    max_tokens=maxTokensIn,
    top_p=1.0,
    frequency_penalty=0.0,
    presence_penalty=0.0
    )

    return response.choices[0].text

def WriteBook(title):
    bookTopic = title
    query = "Give a list of 8 chapter titles for a book about {}".format(bookTopic)
    maxTokens = modelMaxTokens[currentModel] - len(query)
    chaptersText = ChatGPTQuery(query,maxTokens)
    print("Chapter Titles Query Results:")
    for c in chaptersText.split("\n"):
        print(c)

    book = {}
    book["title"] = title
    book["chapters_text"] = chaptersText
    book["chapters"] = {}

    book["allText"] = title + "\n\n" + chaptersText
    lines = chaptersText.split("\n")
    for line in lines:
        firstDot = line.find(".")
        if firstDot > 0:
            numStr = None
            try:
                numStr = int(line[0:firstDot])
            except:
                print("not chapter line")

            if numStr != None:                
                chapterTitle = line[firstDot+1:]
                print("Processing Chapter: {}".format(chapterTitle))
                chapterQuery = "Write a chapter about {}, in book about {}".format(chapterTitle,title)
                maxTokens = modelMaxTokens[currentModel] - len(chapterQuery)
                chapterText = ChatGPTQuery(chapterQuery,maxTokensIn=maxTokens)

                print("Chapter text returned:")
                for c in chapterText.split("\n"):
                    print(c)

                book["allText"] += "Chapter: " + line + "\n"
                book["allText"] += chapterText
                book["chapters"][line] = chapterText

    print("Book Completed, saving to file")

    with open("{} Book_AutoGenerated.json".format(title),"w") as f:
        f.write(json.dumps(book,indent=4))

#WriteBook("Introduction To primary school SENDCO")


import sys

if __name__ == "__main__":
    print(f"Arguments count: {len(sys.argv)}")
    for i, arg in enumerate(sys.argv):
        print(i,arg)
