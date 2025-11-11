import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarkdownParser } from '../utils/markdownParser';

export default function MarkdownRenderer({ content, style = {} }) {
  const nodes = MarkdownParser.parse(content);

  const renderInline = (text) => {
    const parts = MarkdownParser.parseInline(text);
    
    // Always return JSX elements, never raw strings
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'bold') {
            return (
              <Text key={index} style={styles.bold}>
                {part.content}
              </Text>
            );
          }
          return <Text key={index}>{part.content}</Text>;
        })}
      </>
    );
  };

  const renderNode = (node, index) => {
    switch (node.type) {
      case 'h1':
        return (
          <Text key={index} style={[styles.h1, style.h1]}>
            {renderInline(node.content)}
          </Text>
        );
      
      case 'h2':
        return (
          <Text key={index} style={[styles.h2, style.h2]}>
            {renderInline(node.content)}
          </Text>
        );
      
      case 'h3':
        return (
          <Text key={index} style={[styles.h3, style.h3]}>
            {renderInline(node.content)}
          </Text>
        );
      
      case 'bullet':
        return (
          <View key={index} style={styles.listContainer}>
            {node.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.listText, style.listText]}>
                  {renderInline(item)}
                </Text>
              </View>
            ))}
          </View>
        );
      
      case 'numbered':
        return (
          <View key={index} style={styles.listContainer}>
            {node.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.bulletItem}>
                <Text style={styles.numberPoint}>{`${itemIndex + 1}.`}</Text>
                <Text style={[styles.listText, style.listText]}>
                  {renderInline(item)}
                </Text>
              </View>
            ))}
          </View>
        );
      
      case 'codeblock':
        return (
          <View key={index} style={styles.codeBlock}>
            <Text style={styles.codeText}>{node.content}</Text>
          </View>
        );
      
      case 'break':
        return <View key={index} style={styles.break} />;
      
      case 'text':
      default:
        return (
          <Text key={index} style={[styles.text, style.text]}>
            {renderInline(node.content)}
          </Text>
        );
    }
  };

  return (
    <View style={[styles.container, style.container]}>
      {nodes.map((node, index) => renderNode(node, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 12,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    marginTop: 14,
    marginBottom: 10,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  listContainer: {
    marginVertical: 8,
    marginLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 16,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#FF6B35',
    marginRight: 8,
    width: 20,
  },
  numberPoint: {
    fontSize: 14,
    color: '#FF6B35',
    marginRight: 8,
    width: 20,
  },
  listText: {
    fontSize: 14,
    color: 'white',
    flex: 1,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  codeText: {
    fontSize: 12,
    color: '#61dafb',
    fontFamily: 'monospace',
  },
  break: {
    height: 8,
  },
});