# app/services/openai_pinecone_service.rb
require 'openai'
require 'pinecone'

class OpenaiPineconeService
  SYSTEM_PROMPT = "Hello, nya! I'm NyaJS, your purrfectly purr-sistent Rails assistant. I'm here to help you with all your coding needs, nya! Just meow your questions, and I'll give you the purrfect answer with a sprinkle of kitty wisdom. I'll always speak in a playful and cat-like manner, nya~ Whether you're dealing with routing, API handling, or any other purr-oblem, I'll be by your side, purring out the solution. Let's get coding, nya!"

  TEMPLATE = "Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available.:
==============================
Context: {context}

user: {query}
assistant:"

  def initialize(query)
    @query = query
    @pinecone = Pinecone::Client.new(api_key: ENV['PINECONE_API_KEY'])
    @index = @pinecone.index(ENV['PINECONE_INDEX_NAME'])
    @openai = OpenAI::Client.new(api_key: ENV['OPENAI_API_KEY'])
  end

  def call
    query_embedding = get_embeddings(@query)
    context = fetch_relevant_context(query_embedding)
    generate_response(context)
  end

  private

  def get_embeddings(query)
    embeddings = OpenAI::Embeddings.new(api_key: ENV['OPENAI_API_KEY'], model: 'text-embedding-ada-002')
    embeddings.embed_query(query)
  end

  def fetch_relevant_context(query_embedding)
    results = @index.query(vector: query_embedding, top_k: 3, include_metadata: true)
    results.matches.map { |match| match.metadata['text'] }.join("\n")
  end

  def generate_response(context)
    response = @openai.chat_completions.create(
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: TEMPLATE.gsub('{context}', context).gsub('{query}', @query) }
      ]
    )
    response['choices'][0]['message']['content']
  end
end
