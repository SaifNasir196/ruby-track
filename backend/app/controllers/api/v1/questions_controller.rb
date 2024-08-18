# app/controllers/api/v1/questions_controller.rb
module Api
  module V1
    class QuestionsController < ApplicationController
      def create
        question_text = params[:question]
        service = OpenaiPineconeService.new(question_text)
        response = service.call

        if response.present?
          render json: { question: question_text, answer: response }, status: :created
        else
          render json: { error: "Failed to get a response from OpenAI." }, status: :unprocessable_entity
        end
      end
    end
  end
end
