'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, BookOpen, Code, Search, Activity, Layers, FileText, Bug } from 'lucide-react'

interface PromptCategory {
  name: string
  icon: React.ReactNode
  prompts: string[]
}

export default function PromptLibrary() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const categories: PromptCategory[] = [
    {
      name: 'Architecture',
      icon: <Layers className="w-4 h-4" />,
      prompts: [
        'Explain the system architecture',
        'What are the main components?',
        'How does data flow through the system?'
      ]
    },
    {
      name: 'Debugging',
      icon: <Bug className="w-4 h-4" />,
      prompts: [
        'Help me debug this error',
        'Why is the service not responding?',
        'Check the logs for issues'
      ]
    },
    {
      name: 'Audits',
      icon: <FileText className="w-4 h-4" />,
      prompts: [
        'Run a constitutional audit',
        'Check for layer violations',
        'Verify replay determinism'
      ]
    },
    {
      name: 'Runtime',
      icon: <Activity className="w-4 h-4" />,
      prompts: [
        'What is the current runtime status?',
        'Show me performance metrics',
        'Check gateway health'
      ]
    },
    {
      name: 'Research',
      icon: <Search className="w-4 h-4" />,
      prompts: [
        'Search the codebase for patterns',
        'Find similar implementations',
        'Analyze code structure'
      ]
    },
    {
      name: 'Development',
      icon: <Code className="w-4 h-4" />,
      prompts: [
        'Refactor this function',
        'Add error handling',
        'Optimize performance'
      ]
    }
  ]

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  return (
    <div className="w-64 bg-historical-900 border-r border-historical-700 flex flex-col">
      <div className="p-4 border-b border-historical-700">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-constitutional-400" />
          <h3 className="font-semibold text-historical-100">Prompt Library</h3>
        </div>
        <p className="text-xs text-historical-400">Quick-start prompts</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.name)
          return (
            <div key={category.name} className="mb-2">
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-2 hover:bg-historical-800 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="text-runtime-400">{category.icon}</div>
                  <span className="text-sm text-historical-200">{category.name}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-historical-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-historical-500" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 text-xs text-historical-300 hover:bg-historical-800 hover:text-historical-100 rounded transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
