module Api
  module V1
    class QuestionsController < ApplicationController
      def create
        openai_client = OpenAI::Client.new(
          api_key: ENV['OPENAI_API_KEY'],
        )
        question_text = params[:question]

        # Generate embedding for the question using OpenAI
        embedding_response = openai_client.embeddings(parameters: {
          model: "text-embedding-3-large",
          input: question_text
        })

        embedding = embedding_response.dig("data", 0, "embedding")

        if embedding.present?
          pinecone_service = PineconeService.new
          result = pinecone_service.query(embedding)

          # Transform the result to include only the required fields
          transformed_results = result["matches"].map do |match|
            metadata = JSON.parse(match["metadata"]["text"])
            complaint_text = metadata["complaint_what_happened"]

            # Rewrite the complaint text using OpenAI
            rewrite_response = openai_client.chat(
              parameters: {
                model: "gpt-4o-mini",  # Use chat model here
                messages: [
                  {
                    role: "system",
                    content: "Rewrite the following complaint text to make it clearer and more concise. Do not say anything else, only rewrite:"
                  },
                  {
                    role: "user",
                    content: complaint_text
                  }
                ],
                max_tokens: 200
              }
            )

            rewritten_complaint = rewrite_response.dig("choices", 0, "message", "content")
            {
              complaint_what_happened: rewritten_complaint || complaint_text,
              issue: metadata["issue"],
              sub_issue: metadata["sub_issue"],
              product: metadata["product"],
              tags: metadata["tags"]
            }
          end

          # Collect all the tags from the results
          collected_tags = transformed_results.map { |res| res[:tags] }.compact.join(", ")

          # Generate a new tag based on the user's question and collected tags
          tag_generation_response = openai_client.chat(
            parameters: {
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "Based on the user's query and the following tags, suggest the most appropriate tag from the given options only. Do not suggest any of your own, and do not say anything else except the tag name. If there are no appropriate tags, simple say 'Null'."
                },
                {
                  role: "user",
                  content: "Query: #{question_text}, Tags: #{collected_tags}"
                }
              ],
              max_tokens: 10  # Generate a concise tag
            }
          )

          new_tag = tag_generation_response.dig("choices", 0, "message", "content")

          # Generate a 5-word summary of the user's question
          summary_response = openai_client.chat(
            parameters: {
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "Provide a 5-word maximum summary of the following question. Do not say anything else. Only provide the summary:"
                },
                {
                  role: "user",
                  content: question_text
                }
              ],
              max_tokens: 10  # Limit response to a short summary
            }
          )

          question_summary = summary_response.dig("choices", 0, "message", "content")

          # Rails.logger.info "Transformed Result: #{transformed_results.inspect}"
          # Rails.logger.info "Generated Tag: #{new_tag}"

          render json: { 
            question: question_text, 
            summary: question_summary.strip,  # Include the summary in the response
            results: transformed_results, 
            tag: new_tag.strip 
          }, status: :ok
        else
          render json: { error: "Failed to generate embedding." }, status: :unprocessable_entity
        end
      end
    end
  end
end
