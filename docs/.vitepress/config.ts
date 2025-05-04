import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/easy-live2d/',
    title: "EasyLive2d",
    description: "一个基于 Pixi.js 轻量、开发者友好的 Live2D Web SDK 封装库",

    // 忽略死链接检查
    ignoreDeadLinks: true,

    // 国际化配置
    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            link: '/',
            themeConfig: {
                nav: [
                    { text: '主页', link: '/' },
                    { text: '指南', link: '/guide/getting-started', activeMatch: '/guide/' },
                    { text: 'API参考', link: '/api/', activeMatch: '/api/' },
                    { text: '示例', link: '/examples/basic', activeMatch: '/examples/' },
                ],
                sidebar: {
                    '/guide/': [
                        {
                            text: '入门指南',
                            items: [
                                { text: '什么是 EasyLive2d', link: '/guide/' },
                                { text: '快速开始', link: '/guide/getting-started' },
                                { text: '安装配置', link: '/guide/installation' },
                                { text: '基本用法', link: '/guide/basic-usage' },
                            ]
                        },
                        {
                            text: '进阶指南',
                            items: [
                                { text: '模型加载', link: '/guide/model-loading' },
                                { text: '动作控制', link: '/guide/motion-control' },
                                { text: '表情控制', link: '/guide/expression-control' },
                                { text: '事件系统', link: '/guide/events' },
                                { text: '与框架集成', link: '/guide/framework-integration' },
                            ]
                        }
                    ],
                    '/api/': [
                        {
                            text: 'API参考',
                            items: [
                                { text: '概述', link: '/api/' },
                                { text: 'Live2DSprite', link: '/api/live2d-sprite' },
                                { text: '配置选项', link: '/api/config' },
                                { text: '事件类型', link: '/api/events' },
                                { text: '管理器', link: '/api/managers' },
                            ]
                        }
                    ],
                    '/examples/': [
                        {
                            text: '示例',
                            items: [
                                { text: '基础示例', link: '/examples/basic' },
                                { text: '动作与表情', link: '/examples/motion-expression' },
                                { text: '事件处理', link: '/examples/events' },
                                { text: 'Vue集成', link: '/examples/vue-integration' },
                                { text: 'React集成', link: '/examples/react-integration' },
                            ]
                        }
                    ]
                },
                outlineTitle: '页面导航',
                docFooter: {
                    prev: '上一页',
                    next: '下一页'
                },
                lastUpdatedText: '最后更新于',
                darkModeSwitchLabel: '主题',
                sidebarMenuLabel: '目录',
                returnToTopLabel: '返回顶部',
                langMenuLabel: '切换语言',
            }
        },
        en: {
            label: 'English',
            lang: 'en-US',
            link: '/en/',
            themeConfig: {
                nav: [
                    { text: 'Home', link: '/en/' },
                    { text: 'Guide', link: '/en/guide/getting-started', activeMatch: '/en/guide/' },
                    { text: 'API', link: '/en/api/', activeMatch: '/en/api/' },
                    { text: 'Examples', link: '/en/examples/basic', activeMatch: '/en/examples/' },
                ],
                sidebar: {
                    '/en/guide/': [
                        {
                            text: 'Getting Started',
                            items: [
                                { text: 'What is EasyLive2d', link: '/en/guide/' },
                                { text: 'Quick Start', link: '/en/guide/getting-started' },
                                { text: 'Installation', link: '/en/guide/installation' },
                                { text: 'Basic Usage', link: '/en/guide/basic-usage' },
                            ]
                        },
                        {
                            text: 'Advanced Guide',
                            items: [
                                { text: 'Model Loading', link: '/en/guide/model-loading' },
                                { text: 'Motion Control', link: '/en/guide/motion-control' },
                                { text: 'Expression Control', link: '/en/guide/expression-control' },
                                { text: 'Events', link: '/en/guide/events' },
                                { text: 'Framework Integration', link: '/en/guide/framework-integration' },
                            ]
                        }
                    ],
                    '/en/api/': [
                        {
                            text: 'API Reference',
                            items: [
                                { text: 'Overview', link: '/en/api/' },
                                { text: 'Live2DSprite', link: '/en/api/live2d-sprite' },
                                { text: 'Configuration', link: '/en/api/config' },
                                { text: 'Event Types', link: '/en/api/events' },
                                { text: 'Managers', link: '/en/api/managers' },
                            ]
                        }
                    ],
                    '/en/examples/': [
                        {
                            text: 'Examples',
                            items: [
                                { text: 'Basic', link: '/en/examples/basic' },
                                { text: 'Motion & Expression', link: '/en/examples/motion-expression' },
                                { text: 'Event Handling', link: '/en/examples/events' },
                                { text: 'Vue Integration', link: '/en/examples/vue-integration' },
                                { text: 'React Integration', link: '/en/examples/react-integration' },
                            ]
                        }
                    ]
                },
                outlineTitle: 'On this page',
                docFooter: {
                    prev: 'Previous page',
                    next: 'Next page'
                },
                lastUpdatedText: 'Last updated',
                darkModeSwitchLabel: 'Theme',
                sidebarMenuLabel: 'Menu',
                returnToTopLabel: 'Return to top',
                langMenuLabel: 'Change language',
            }
        }
    },

    lastUpdated: true,

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/logo.png',

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Panzer-Jack/easy-live2d' }
        ],

        footer: {
            message: '基于 MIT 许可发布',
            copyright: `Copyright © ${new Date().getFullYear()} Panzer_Jack`
        },

        search: {
            provider: 'local'
        }
    }
})