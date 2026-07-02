<template>
  <div class="article-manager">
    <!-- ======== 缓冲进度条 ======== -->
    <md-linear-progress
      v-if="loader.loadingActive.value"
      :class="{ 'loading-progress--fading': loader.loadingFading.value }"
      class="loading-progress"
      :value="loader.progressValue.value"
      :buffer="loader.progressBuffer.value"
    ></md-linear-progress>

    <!-- ======== 骨架屏 ======== -->
    <div v-if="!loader.dataLoaded.value" class="skeleton-container">
      <div class="skeleton skeleton--topbar"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton--page-title"></div>
        <div class="skeleton skeleton--filter-bar"></div>
        <div class="skeleton skeleton--row" v-for="n in 5" :key="n"></div>
      </div>
    </div>

    <!-- ======== 真实内容 ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">

      <!-- ======== 编辑器模式 ======== -->
      <section v-if="editingIndex !== -1" class="ed">
        <!-- ======== 编辑器 Topbar ======== -->
        <header class="ed-topbar">
          <div class="ed-topbar__left">
            <button class="ed-topbar__back" @click="closeEditor" aria-label="返回列表">
              <span class="material-symbols-rounded">arrow_back</span>
            </button>
            <span class="ed-topbar__crumb" @click="closeEditor">Articles</span>
            <span class="material-symbols-rounded ed-topbar__chevron">chevron_right</span>
            <span class="ed-topbar__current">{{ form.title || '未命名文章' }}</span>
            <span class="ed-topbar__badge" :class="form.isPublished ? 'ed-topbar__badge--published' : 'ed-topbar__badge--draft'">
              {{ form.isPublished ? 'Published' : 'Draft' }}
            </span>
          </div>
          <div class="ed-topbar__center">
            <span v-if="lastSavedAt" class="ed-topbar__save-status">
              <span class="material-symbols-rounded ed-topbar__save-check">check_circle</span>
              Last saved {{ lastSavedAt }}
            </span>
          </div>
          <div class="ed-topbar__right">
            <button class="ed-btn ed-btn--outlined" @click="onPreview" :disabled="saving">
              <span class="material-symbols-rounded">visibility</span>
              Preview
            </button>
            <button class="ed-btn ed-btn--outlined" @click="onSaveDraft" :disabled="saving">
              <span class="material-symbols-rounded">save</span>
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
            <button class="ed-btn ed-btn--filled" @click="onSavePublish" :disabled="saving">
              <span class="material-symbols-rounded">upload</span>
              {{ saving ? 'Publishing...' : 'Publish' }}
              <span class="material-symbols-rounded ed-btn__arrow">expand_more</span>
            </button>
          </div>
        </header>

        <!-- ======== 编辑器三栏主体 ======== -->
        <div class="ed-body">
          <!-- 左栏：大纲 Outline -->
          <aside class="ed-outline">
            <div class="ed-outline__header">
              <span class="ed-outline__title">Outline</span>
              <button class="ed-outline__add" aria-label="Add heading" @click="insertMd('heading')">
                <span class="material-symbols-rounded">add</span>
              </button>
            </div>
            <nav class="ed-outline__list">
              <template v-for="(h, hi) in outlineHeadings" :key="hi">
                <button
                  class="ed-outline__item"
                  :class="{ 'ed-outline__item--h3': h.level === 3 }"
                  @click="scrollToHeading(h.line)"
                >
                  <span class="ed-outline__item-label">{{ h.text }}</span>
                  <button class="ed-outline__item-remove" @click.stop="removeHeading(h.line)" aria-label="Remove heading">
                    <span class="material-symbols-rounded">close</span>
                  </button>
                </button>
              </template>
              <div v-if="!outlineHeadings.length" class="ed-outline__empty">
                Add headings to create an outline
              </div>
            </nav>
          </aside>

          <!-- 中栏：主编辑区 -->
          <main class="ed-main">
            <!-- 格式化工具栏 -->
            <div class="ed-toolbar">
              <div class="ed-toolbar__left">
                <div class="ed-toolbar__heading-wrap">
                  <button class="ed-toolbar__btn ed-toolbar__heading-btn" @click="headingMenuOpen = !headingMenuOpen">
                    {{ headingLabel }} <span class="material-symbols-rounded">expand_more</span>
                  </button>
                  <div v-if="headingMenuOpen" class="ed-toolbar__heading-menu">
                    <button v-for="h in headingOptions" :key="h.key" @click="insertMd(h.key); headingMenuOpen = false"
                      class="ed-toolbar__heading-option" :class="{ 'ed-toolbar__heading-option--active': headingLabel === h.label }">
                      <span :class="'ed-toolbar__heading-preview ed-toolbar__heading-preview--' + h.key">{{ h.label }}</span>
                    </button>
                  </div>
                </div>
                <div class="ed-toolbar__divider"></div>
                <button class="ed-toolbar__icon-btn" @click="insertMd('bold')" title="Bold (Ctrl+B)"><strong>B</strong></button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('italic')" title="Italic (Ctrl+I)"><em>I</em></button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('strikethrough')" title="Strikethrough"><s>S</s></button>
                <div class="ed-toolbar__divider"></div>
                <button class="ed-toolbar__icon-btn" @click="insertMd('link')" title="Insert link">
                  <span class="material-symbols-rounded">link</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('image')" title="Insert image">
                  <span class="material-symbols-rounded">image</span>
                </button>
                <div class="ed-toolbar__divider"></div>
                <button class="ed-toolbar__icon-btn" @click="insertMd('ul')" title="Bullet list">
                  <span class="material-symbols-rounded">format_list_bulleted</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('ol')" title="Numbered list">
                  <span class="material-symbols-rounded">format_list_numbered</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('quote')" title="Blockquote">
                  <span class="material-symbols-rounded">format_quote</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('code')" title="Inline code">
                  <span class="material-symbols-rounded">code</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('codeblock')" title="Code block">
                  <span class="material-symbols-rounded">data_object</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('table')" title="Insert table">
                  <span class="material-symbols-rounded">table_chart</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="insertMd('hr')" title="Horizontal rule">
                  <span class="material-symbols-rounded">horizontal_rule</span>
                </button>
              </div>
              <div class="ed-toolbar__right">
                <button class="ed-toolbar__icon-btn" :class="{ 'ed-toolbar__icon-btn--active': markdownTab === 'split' }" @click="markdownTab = markdownTab === 'split' ? 'edit' : 'split'" title="Split view">
                  <span class="material-symbols-rounded">vertical_split</span>
                </button>
                <button class="ed-toolbar__icon-btn" :class="{ 'ed-toolbar__icon-btn--active': markdownTab === 'preview' }" @click="markdownTab = markdownTab === 'preview' ? 'edit' : 'preview'" title="Preview">
                  <span class="material-symbols-rounded">visibility</span>
                </button>
                <button class="ed-toolbar__icon-btn" @click="toggleFullscreen" title="Fullscreen">
                  <span class="material-symbols-rounded">fullscreen</span>
                </button>
              </div>
            </div>

            <!-- 标题 / 摘要 / 内容 -->
            <div class="ed-content">
              <input
                class="ed-content__title"
                :value="form.title"
                @input="form.title = $event.target.value"
                placeholder="Article title..."
              />
              <input
                class="ed-content__excerpt"
                :value="form.description"
                @input="form.description = $event.target.value"
                placeholder="Add a short description or excerpt for your article..."
              />
              <div class="ed-content__editor-body" :class="'ed-content__editor-body--' + markdownTab">
                <textarea
                  v-show="markdownTab === 'edit' || markdownTab === 'split'"
                  ref="textareaRef"
                  class="ed-content__textarea"
                  :value="form.content"
                  @input="onTextareaInput"
                  placeholder="Start writing your article..."
                  spellcheck="false"
                ></textarea>
                <div
                  v-show="markdownTab === 'preview' || markdownTab === 'split'"
                  class="ed-content__preview markdown-body"
                  v-html="renderedMarkdown"
                ></div>
              </div>
            </div>

            <!-- 底部状态栏 -->
            <div class="ed-bottombar">
              <div class="ed-bottombar__left">
                <button class="ed-bottombar__mode-btn" @click="toggleMarkdownMode">
                  Markdown <span class="material-symbols-rounded">expand_more</span>
                </button>
              </div>
              <div class="ed-bottombar__right">
                <span class="ed-bottombar__stat">{{ wordCount }} words</span>
                <span class="ed-bottombar__stat">{{ charCount }} characters</span>
                <span class="ed-bottombar__stat">{{ readTime }} min read</span>
                <button class="ed-bottombar__icon-btn" title="Focus mode">
                  <span class="material-symbols-rounded">visibility</span>
                  Focus
                </button>
                <button class="ed-bottombar__icon-btn" title="Help">
                  <span class="material-symbols-rounded">help</span>
                </button>
              </div>
            </div>
          </main>

          <!-- 右栏：文档设置 -->
          <aside class="ed-settings">
            <!-- Tabs -->
            <div class="ed-settings__tabs">
              <button
                class="ed-settings__tab"
                :class="{ 'ed-settings__tab--active': settingsTab === 'document' }"
                @click="settingsTab = 'document'"
              >Document</button>
              <button
                class="ed-settings__tab"
                :class="{ 'ed-settings__tab--active': settingsTab === 'history' }"
                @click="settingsTab = 'history'"
              >History</button>
            </div>

            <!-- Document Tab Content -->
            <div v-if="settingsTab === 'document'" class="ed-settings__content">
              <!-- Status -->
              <div class="ed-settings__section">
                <h4 class="ed-settings__section-title">Status</h4>
                <button class="ed-settings__dropdown" @click="statusDropdownEditorOpen = !statusDropdownEditorOpen">
                  <span class="ed-settings__status-dot" :class="form.isPublished ? 'ed-settings__status-dot--published' : 'ed-settings__status-dot--draft'"></span>
                  {{ form.isPublished ? 'Published' : 'Draft' }}
                  <span class="material-symbols-rounded ed-settings__dropdown-arrow">expand_more</span>
                </button>
                <div v-if="statusDropdownEditorOpen" class="ed-settings__dropdown-menu">
                  <button @click="form.isPublished = false; statusDropdownEditorOpen = false">
                    <span class="ed-settings__status-dot ed-settings__status-dot--draft"></span> Draft
                  </button>
                  <button @click="form.isPublished = true; statusDropdownEditorOpen = false">
                    <span class="ed-settings__status-dot ed-settings__status-dot--published"></span> Published
                  </button>
                </div>
                <p class="ed-settings__helper">
                  {{ form.isPublished ? 'This article is published and visible to readers.' : 'This article is in draft mode and not visible to readers.' }}
                </p>
              </div>

              <!-- Category -->
              <div class="ed-settings__section ed-settings__category-dropdown">
                <h4 class="ed-settings__section-title">Category</h4>
                <button class="ed-settings__dropdown" @click="categoryEditorOpen = !categoryEditorOpen">
                  <span class="material-symbols-rounded">folder</span>
                  {{ form.tagsDisplay ? formTags[0] : 'Select category' }}
                  <span class="material-symbols-rounded ed-settings__dropdown-arrow">expand_more</span>
                </button>
                <div v-if="categoryEditorOpen" class="ed-settings__dropdown-menu">
                  <button v-for="cat in editorCategoryOptions" :key="cat" @click="setCategory(cat); categoryEditorOpen = false">
                    <span class="material-symbols-rounded">folder</span> {{ cat }}
                  </button>
                  <button v-if="!editorCategoryOptions.length" disabled class="ed-settings__dropdown-empty">
                    No categories available
                  </button>
                </div>
              </div>

              <!-- Tags -->
              <div class="ed-settings__section">
                <h4 class="ed-settings__section-title">Tags</h4>
                <div class="ed-settings__tags">
                  <span
                    v-for="(tag, ti) in formTags"
                    :key="ti"
                    class="ed-settings__tag"
                  >
                    {{ tag }}
                    <button class="ed-settings__tag-remove" @click="removeTag(tag)">
                      <span class="material-symbols-rounded">close</span>
                    </button>
                  </span>
                  <button class="ed-settings__tag-add" @click="showTagInput = true">
                    <span class="material-symbols-rounded">add</span>
                    Add tag
                  </button>
                </div>
                <div v-if="showTagInput" class="ed-settings__tag-input-row">
                  <input
                    class="ed-settings__tag-input"
                    v-model="newTagValue"
                    @keydown.enter="addTag"
                    @keydown.escape="showTagInput = false; newTagValue = ''"
                    placeholder="Tag name"
                    autofocus
                  />
                  <button class="ed-settings__tag-input-confirm" @click="addTag">
                    <span class="material-symbols-rounded">check</span>
                  </button>
                </div>
              </div>

              <!-- Featured Image -->
              <div class="ed-settings__section">
                <h4 class="ed-settings__section-title">Featured Image</h4>
                <div class="ed-settings__featured">
                  <div v-if="form.featuredImage" class="ed-settings__featured-preview" @click="featuredImageExpanded = !featuredImageExpanded">
                    <img :src="form.featuredImage" :alt="form.featuredImageAlt || 'Featured'" />
                  </div>
                  <div v-else class="ed-settings__featured-placeholder" @click="featuredImageExpanded = !featuredImageExpanded">
                    <span class="material-symbols-rounded">add_photo_alternate</span>
                    <span>Click to add image URL</span>
                  </div>
                  <div v-if="featuredImageExpanded" class="ed-settings__featured-form">
                    <label class="ed-settings__alt-label">Image URL</label>
                    <input class="ed-settings__alt-input" v-model="form.featuredImage" placeholder="https://example.com/image.png" />
                    <label class="ed-settings__alt-label" style="margin-top:8px">Alt text</label>
                    <input class="ed-settings__alt-input" v-model="form.featuredImageAlt" placeholder="Describe the image..." />
                    <div class="ed-settings__featured-actions">
                      <button v-if="form.featuredImage" class="ed-btn ed-btn--sm ed-btn--outlined" @click="form.featuredImage = ''; form.featuredImageAlt = ''">
                        <span class="material-symbols-rounded">delete</span> Remove
                      </button>
                      <button class="ed-btn ed-btn--sm ed-btn--outlined" @click="featuredImageExpanded = false">
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SEO -->
              <div class="ed-settings__section ed-settings__section--collapsible" @click="seoExpanded = !seoExpanded">
                <h4 class="ed-settings__section-title">
                  SEO
                  <span class="material-symbols-rounded ed-settings__section-arrow" :class="{ 'ed-settings__section-arrow--open': seoExpanded }">expand_more</span>
                </h4>
              </div>
              <div v-if="seoExpanded" class="ed-settings__section">
                <label class="ed-settings__alt-label">Meta title</label>
                <input class="ed-settings__alt-input" v-model="form.seoTitle" :placeholder="form.title || 'Article title'" />
                <label class="ed-settings__alt-label" style="margin-top:8px">Meta description</label>
                <textarea class="ed-settings__alt-input ed-settings__textarea-field" v-model="form.seoDescription" rows="2" :placeholder="form.description || 'Article description'"></textarea>
                <label class="ed-settings__alt-label" style="margin-top:8px">Keywords</label>
                <input class="ed-settings__alt-input" v-model="form.seoKeywords" placeholder="keyword1, keyword2" />
                <p class="ed-settings__helper" style="margin-top:4px">
                  {{ form.seoDescription ? form.seoDescription.length : 0 }}/160 characters recommended
                </p>
              </div>

              <!-- More Options -->
              <div class="ed-settings__section ed-settings__section--collapsible" @click="moreExpanded = !moreExpanded">
                <h4 class="ed-settings__section-title">
                  More Options
                  <span class="material-symbols-rounded ed-settings__section-arrow" :class="{ 'ed-settings__section-arrow--open': moreExpanded }">expand_more</span>
                </h4>
              </div>
              <div v-if="moreExpanded" class="ed-settings__section">
                <label class="ed-settings__alt-label">Slug (URL identifier)</label>
                <input class="ed-settings__alt-input" v-model="form.slug" placeholder="auto-generated from title" />
                <p class="ed-settings__helper">Leave empty to auto-generate from title</p>
                <label class="ed-settings__alt-label" style="margin-top:8px">Custom date</label>
                <input class="ed-settings__alt-input" type="date" v-model="form.date" />
                <label class="ed-settings__alt-label" style="margin-top:8px">Sort order</label>
                <input class="ed-settings__alt-input" type="number" v-model.number="form.sortOrder" placeholder="0" />
              </div>

              <!-- Delete -->
              <div class="ed-settings__section ed-settings__section--danger">
                <button class="ed-settings__delete-btn" @click="onRemove(editingIndex)">
                  <span class="material-symbols-rounded">delete</span>
                  Delete article
                </button>
              </div>
            </div>

            <!-- History Tab Content (placeholder) -->
            <div v-if="settingsTab === 'history'" class="ed-settings__content">
              <div class="ed-settings__empty-state">
                <span class="material-symbols-rounded">history</span>
                <p>Version history will appear here</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- ======== 列表模式 ======== -->
      <template v-else>
        <!-- 顶部栏（共享组件） -->
        <AdminTopbar @new-article="onCreate" />

        <!-- 两栏布局：子导航 + 主内容 -->
        <div class="am-layout">
          <!-- ======== 二级子导航面板 ======== -->
          <aside class="am-subnav">
            <!-- Articles 分组 -->
            <div class="am-subnav__group">
              <div class="am-subnav__group-header">
                <span class="am-subnav__group-title">Articles</span>
              </div>
              <button
                v-for="item in subnavArticles"
                :key="item.value"
                class="am-subnav__item"
                :class="{ 'am-subnav__item--active': activeSubnav === item.value }"
                @click="activeSubnav = item.value; showPublishedFilter = item.filter; categoryFilter = ''; currentPage = 1"
              >
                <span class="am-subnav__item-label">{{ item.label }}</span>
                <span class="am-subnav__item-count">{{ item.count }}</span>
              </button>
            </div>

            <!-- Categories 分组 -->
            <div class="am-subnav__divider"></div>
            <div class="am-subnav__group">
              <div class="am-subnav__group-header">
                <span class="am-subnav__group-title">Categories</span>
                <button class="am-subnav__group-edit" aria-label="Edit categories" @click="showTagColorDialog = true">
                  <span class="material-symbols-rounded">edit</span>
                </button>
              </div>
              <button
                v-for="item in visibleCategories"
                :key="item.value"
                class="am-subnav__item"
                :class="{ 'am-subnav__item--active': categoryFilter.toLowerCase() === item.value }"
                @click="categoryFilter === item.label ? (categoryFilter = '') : (categoryFilter = item.label); activeSubnav = 'category-' + item.value; showPublishedFilter = 'all'; currentPage = 1"
              >
                <span class="am-subnav__cat-dot" :style="{ background: item.color }"></span>
                <span class="am-subnav__item-label">{{ item.label }}</span>
                <span class="am-subnav__item-count">{{ item.count }}</span>
              </button>
              <button
                v-if="subnavCategories.length > 5"
                class="am-subnav__expand"
                @click="categoryLimit = categoryLimit === 5 ? subnavCategories.length : 5"
              >
                <span class="am-subnav__expand-dots">{{ categoryLimit === 5 ? '•••' : '收起' }}</span>
              </button>
            </div>
          </aside>

          <!-- ======== 主内容区 ======== -->
          <div class="am-main">
            <!-- 页面标题 -->
            <div class="am-page-header">
              <h1 class="am-page-header__title">All Articles</h1>
              <p class="am-page-header__subtitle">{{ filteredArticles.length }} articles found</p>
            </div>

            <!-- 筛选栏 -->
            <div class="am-filter-bar">
              <div class="am-filter-bar__search">
                <span class="material-symbols-rounded">search</span>
                <input v-model="searchQuery" type="text" placeholder="Search articles..." class="am-filter-bar__search-input" />
              </div>
              <button class="am-dropdown" @click="statusDropdownOpen = !statusDropdownOpen">
                <span>{{ statusFilter || 'Status' }}</span>
                <span class="material-symbols-rounded am-dropdown__chevron">expand_more</span>
              </button>
              <button class="am-dropdown" @click="categoryDropdownOpen = !categoryDropdownOpen">
                <span>{{ categoryFilter || 'Category' }}</span>
                <span class="material-symbols-rounded am-dropdown__chevron">expand_more</span>
              </button>
              <button class="am-dropdown" @click="tagDropdownOpen = !tagDropdownOpen">
                <span>{{ tagFilter || 'Tag' }}</span>
                <span class="material-symbols-rounded am-dropdown__chevron">expand_more</span>
              </button>
              <button class="am-sort-btn" @click="toggleSort">
                <span class="material-symbols-rounded">{{ sortAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
                <span>Sort: {{ sortField }}</span>
              </button>
              <div class="am-filter-bar__spacer"></div>
              <div class="am-view-toggle">
                <button class="am-view-toggle__btn" :class="{ 'am-view-toggle__btn--active': viewMode === 'list' }" @click="viewMode = 'list'" aria-label="List view">
                  <span class="material-symbols-rounded">view_list</span>
                </button>
                <button class="am-view-toggle__btn" :class="{ 'am-view-toggle__btn--active': viewMode === 'grid' }" @click="viewMode = 'grid'" aria-label="Grid view">
                  <span class="material-symbols-rounded">grid_view</span>
                </button>
              </div>
            </div>

            <!-- 文章列表表格 -->
            <div v-if="filteredArticles.length" class="am-table">
              <!-- 文章行 -->
              <div
                v-for="art in paginatedArticles"
                :key="art.documentId"
                class="am-article-row"
                :class="{ 'am-article-row--selected': selectedIds.has(art.documentId) }"
                @click="onEdit(findOriginalIndex(art))"
              >
                <label class="am-checkbox" @click.stop>
                  <input type="checkbox" :checked="selectedIds.has(art.documentId)" @change="toggleSelect(art.documentId)" />
                  <span class="am-checkbox__box"></span>
                </label>
                <div class="am-article-row__col-article">
                  <div class="am-article-row__thumb" :class="art.publishedAt ? 'am-article-row__thumb--published' : 'am-article-row__thumb--draft'">
                    <span class="material-symbols-rounded">{{ art.publishedAt ? 'article' : 'edit_note' }}</span>
                  </div>
                  <div class="am-article-row__info">
                    <span class="am-article-row__title">{{ art.title || '(无标题)' }}</span>
                    <span class="am-article-row__desc">{{ art.description || '暂无描述' }}</span>
                  </div>
                </div>
                <span class="am-article-row__col-status">
                  <span class="am-status-tag" :class="art.publishedAt ? 'am-status-tag--published' : 'am-status-tag--draft'">
                    {{ art.publishedAt ? 'Published' : 'Draft' }}
                  </span>
                </span>
                <span class="am-article-row__col-date">{{ formatDate(art.publishedAt || art.createdAt) }}</span>
                <span class="am-article-row__col-readtime">{{ getReadTime(art.content) }}</span>
                <span class="am-article-row__col-tags">
                  <AdminTag
                    v-for="(tag, ti) in getVisibleTags(art.tags)"
                    :key="ti"
                    :label="tag"
                  />
                  <span v-if="art.tags && art.tags.length > 2" class="am-tag-overflow">+{{ art.tags.length - 2 }}</span>
                  <span v-else-if="art.tags && art.tags.length === 0" class="am-article-row__col-tags-placeholder">—</span>
                </span>
                <button class="am-article-row__menu" @click.stop aria-label="More options">
                  <span class="material-symbols-rounded">more_vert</span>
                </button>
              </div>
            </div>

            <!-- 底部批量操作栏 + 分页（独立容器，位于表格外部） -->
            <div v-if="filteredArticles.length" class="am-bottom-bar">
              <div class="am-bottom-bar__left">
                <label class="am-checkbox">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll($event)" />
                  <span class="am-checkbox__box"></span>
                </label>
                <span class="am-bottom-bar__count">{{ selectedIds.size }} selected</span>
                <div class="am-bottom-bar__actions">
                  <button class="am-bottom-bar__btn" :disabled="selectedIds.size === 0" @click="bulkPublish">
                    <span class="material-symbols-rounded">publish</span>
                    Publish
                  </button>
                  <button class="am-bottom-bar__btn" :disabled="selectedIds.size === 0" @click="selectedIds.clear()">Archive</button>
                  <button class="am-bottom-bar__btn am-bottom-bar__btn--danger" :disabled="selectedIds.size === 0" @click="bulkDelete">
                    <span class="material-symbols-rounded">delete</span>
                    Delete
                  </button>
                  <button class="am-bottom-bar__btn am-bottom-bar__btn--icon" :disabled="selectedIds.size === 0" aria-label="More actions">
                    <span class="material-symbols-rounded">more_horiz</span>
                  </button>
                </div>
              </div>
              <div class="am-pagination">
                <button class="am-pagination__btn" :disabled="currentPage <= 1" @click="currentPage--">
                  <span class="material-symbols-rounded">chevron_left</span>
                </button>
                <button
                  v-for="p in pageNumbers"
                  :key="p"
                  class="am-pagination__page"
                  :class="{ 'am-pagination__page--active': p === currentPage }"
                  @click="currentPage = p"
                >{{ p }}</button>
                <button class="am-pagination__btn" :disabled="currentPage >= totalPages" @click="currentPage++">
                  <span class="material-symbols-rounded">chevron_right</span>
                </button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="am-empty">
              <span class="material-symbols-rounded am-empty__icon">article</span>
              <p class="am-empty__title">暂无文章</p>
              <p class="am-empty__desc">点击右上角 New Article 创建第一篇文章</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 删除确认 -->
      <md-dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false">
        <div slot="headline">确认删除</div>
        <div slot="content">确定删除文章「{{ deleteTarget?.title }}」？此操作不可撤销。</div>
        <div slot="actions">
          <md-text-button @click="showDeleteConfirm = false">取消</md-text-button>
          <md-filled-button @click="confirmDelete" :disabled="saving">删除</md-filled-button>
        </div>
      </md-dialog>

      <!-- Tag 颜色编辑对话框 -->
      <md-dialog :open="showTagColorDialog" @close="showTagColorDialog = false" class="tag-color-dialog">
        <div slot="headline">Edit Category Colors</div>
        <div slot="content">
          <div style="display:flex;flex-direction:column;gap:12px;min-width:320px;">
            <div
              v-for="cat in subnavCategories"
              :key="cat.value"
              style="display:flex;align-items:center;gap:12px;"
            >
              <span class="am-subnav__cat-dot" :style="{ background: PRESET_COLORS[customTagColors[cat.value] !== undefined ? customTagColors[cat.value] : getTagColorIndex(cat.label)].color }"></span>
              <span style="flex:1;font-size:14px;">{{ cat.label }}</span>
              <div style="display:flex;gap:4px;">
                <button
                  v-for="(preset, pi) in PRESET_COLORS"
                  :key="pi"
                  class="tag-color-dot-btn"
                  :class="{ 'tag-color-dot-btn--active': (customTagColors[cat.value] !== undefined ? customTagColors[cat.value] : getTagColorIndex(cat.label)) === pi }"
                  :style="{ background: preset.color }"
                  @click="customTagColors[cat.value] = pi; saveCustomTagColors()"
                  :aria-label="'Color ' + pi"
                ></button>
              </div>
            </div>
          </div>
        </div>
        <div slot="actions">
          <md-text-button @click="showTagColorDialog = false">Done</md-text-button>
        </div>
      </md-dialog>

      <!-- 操作提示 -->
      <div v-if="operationMessage" class="operation-notice" :class="{ 'operation-notice--error': operationError }">
        <span class="material-symbols-rounded operation-notice__icon">{{ operationError ? 'error' : 'check_circle' }}</span>
        <span class="operation-notice__text">{{ operationMessage }}</span>
      </div>
    </div>

    <!-- ======== 博客预览弹窗（完全复刻 BlogArticleView 发布页面布局）======== -->
    <Teleport to="body">
      <div v-if="showPreviewDialog" class="ed-preview-overlay" @click.self="closePreview" @keydown.esc="closePreview">
        <!-- 预览工具栏 -->
        <header class="ed-preview-toolbar">
          <span class="ed-preview-toolbar__label">Preview</span>
          <div class="ed-preview-toolbar__right">
            <button class="ed-btn ed-btn--outlined ed-preview-toolbar__btn" @click="closePreview">
              <span class="material-symbols-rounded">close</span> Close
            </button>
          </div>
        </header>
        <!-- 可滚动内容区 -->
        <div class="ed-preview-scroll">
          <!-- mio-header（对照 BlogArticleView：双列 grid，primary-container + split-asset-image）-->
          <header class="ed-preview-mio-header">
            <div class="ed-preview-primary-container">
              <div class="ed-preview-wrapper">
                <div class="ed-preview-date">
                  <span v-if="form.date">{{ form.date }}</span>
                  <span v-else>{{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
                <div class="ed-preview-title-block">
                  <h1>{{ form.title || 'Untitled Article' }}</h1>
                  <div class="ed-preview-description" v-if="form.description">{{ form.description }}</div>
                </div>
              </div>
            </div>
            <!-- split-asset-image（渐变占位，对照 BlogArticleView 无头图时）-->
            <div class="ed-preview-split-asset-image">
              <div class="ed-preview-split-asset-image__foreground"></div>
            </div>
          </header>

          <!-- content-container（对照 BlogArticleView：authors + separator + blog-content）-->
          <div class="ed-preview-blog-content-container">
            <article class="ed-preview-blog-section">
              <!-- authors 区域 -->
              <div class="ed-preview-authors">
                <p class="ed-preview-overline">Posted by</p>
                <div class="ed-preview-byline">
                  <img class="ed-preview-author-avatar" src="/favicon.ico" alt="Kernel" />
                  <div class="ed-preview-author-info">
                    <span class="ed-preview-author-name">Kernel</span>
                    <span class="ed-preview-author-role">Author</span>
                  </div>
                </div>
              </div>

              <!-- separator -->
              <hr class="ed-preview-separator" />

              <!-- blog-content -->
              <div class="ed-preview-blog-content" v-html="previewHtml"></div>
            </article>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { cmCreate, cmUpdate, cmDelete } from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import { Marked } from 'marked'
import { marked as globalMarked } from 'marked'
import '@material/web/button/filled-button'
import '@material/web/button/outlined-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/switch/switch'
import '@material/web/progress/linear-progress'
import AdminTopbar from './AdminTopbar.vue'
import AdminTag from './AdminTag.vue'

const UID = 'api::article.article'

const props = defineProps({ token: { type: String, required: true } })

// ===== 共享加载控制器 =====
const loader = useAdminLoader()

const articles = ref([])
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref(null)
const editingIndex = ref(-1)
const markdownTab = ref('edit')
const showPublishedFilter = ref('all')
const textareaRef = ref(null)

// ===== 编辑器新增状态 =====
const settingsTab = ref('document')
const statusDropdownEditorOpen = ref(false)
const categoryEditorOpen = ref(false)
const seoExpanded = ref(false)
const moreExpanded = ref(false)
const featuredImageExpanded = ref(false)
const showTagInput = ref(false)
const newTagValue = ref('')
const lastSavedAt = ref('')
const headingMenuOpen = ref(false)

// ===== Heading 选项 =====
const headingOptions = [
  { key: 'paragraph', label: 'Paragraph' },
  { key: 'h1', label: 'Heading 1' },
  { key: 'h2', label: 'Heading 2' },
  { key: 'h3', label: 'Heading 3' },
  { key: 'h4', label: 'Heading 4' },
]
const headingLabel = computed(() => {
  // 检测当前光标所在行的 heading 级别
  return 'Heading 2' // default
})

// ===== 列表视图状态 =====
const searchQuery = ref('')
const sortField = ref('Updated')
const sortAsc = ref(true)
const viewMode = ref('list')
const currentPage = ref(1)
const pageSize = 7
const selectedIds = ref(new Set())

// ===== 下拉筛选状态 =====
const statusFilter = ref('')
const categoryFilter = ref('')
const tagFilter = ref('')
const statusDropdownOpen = ref(false)
const categoryDropdownOpen = ref(false)
const tagDropdownOpen = ref(false)

// ===== 二级子导航状态 =====
const activeSubnav = ref('all')

// ===== Categories 折叠状态 =====
const categoryLimit = ref(5)

const visibleCategories = computed(() => {
  return subnavCategories.value.slice(0, categoryLimit.value)
})

// ===== tag 颜色编辑对话框 =====
const showTagColorDialog = ref(false)

// ===== tag→分类颜色映射（从 AdminTag 逻辑同步） =====
// 预设分类颜色池：每个 tag 从此池中轮转分配，或可通过编辑按钮自定义
const PRESET_COLORS = [
  { color: '#3b82f6', bg: '#EFF8FF', text: '#3b82f6', darkBg: '#1e3a5f', darkText: '#60a5fa' },
  { color: '#4f46e5', bg: '#F5F3FF', text: '#4f46e5', darkBg: '#312e81', darkText: '#a5b4fc' },
  { color: '#10b981', bg: '#ECFDF3', text: '#10b981', darkBg: '#06381f', darkText: '#34d399' },
  { color: '#8b5cf6', bg: '#F5F3FF', text: '#8b5cf6', darkBg: '#312e81', darkText: '#c4b5fd' },
  { color: '#f59e0b', bg: '#FFF6ED', text: '#f59e0b', darkBg: '#3a2200', darkText: '#fbbf24' },
  { color: '#ef4444', bg: '#FEF2F2', text: '#ef4444', darkBg: '#450a0a', darkText: '#fca5a5' },
  { color: '#06b6d4', bg: '#ECFEFF', text: '#06b6d4', darkBg: '#083344', darkText: '#67e8f9' },
  { color: '#ec4899', bg: '#FDF2F8', text: '#ec4899', darkBg: '#500724', darkText: '#f9a8d4' },
]

// 用户自定义 tag 颜色（持久化到 localStorage）
const customTagColors = ref({})
try {
  const stored = localStorage.getItem('admin-tag-colors')
  if (stored) customTagColors.value = JSON.parse(stored)
} catch {}

function saveCustomTagColors() {
  localStorage.setItem('admin-tag-colors', JSON.stringify(customTagColors.value))
  window.dispatchEvent(new CustomEvent('admin-tag-colors-changed'))
}

function getTagColorSet(tagLabel) {
  const key = tagLabel.toLowerCase()
  if (customTagColors.value[key] !== undefined) return PRESET_COLORS[customTagColors.value[key]]
  // 默认：根据 tag 文字哈希分配颜色
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length]
}

function getTagColorIndex(tagLabel) {
  const key = tagLabel.toLowerCase()
  if (customTagColors.value[key] !== undefined) return customTagColors.value[key]
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % PRESET_COLORS.length
}

// ===== 操作提示 =====
const operationMessage = ref('')
const operationError = ref(false)
let noticeTimer = null
function showNotice(msg, isError = false) {
  operationMessage.value = msg
  operationError.value = isError
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { operationMessage.value = '' }, 4000)
}

const form = ref({
  title: '',
  slug: '',
  description: '',
  content: '',
  date: '',
  sortOrder: 0,
  tagsDisplay: '',
  isPublished: false,
  featuredImage: '',
  featuredImageAlt: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
})

// ===== Markdown 渲染 =====
// 使用独立的 Marked 实例，避免 articleService 全局配置的 m3Renderer（copy-link 等）
const editorMarked = new Marked()

const renderedMarkdown = computed(() => {
  try {
    return editorMarked.parse(form.value.content || '')
  } catch {
    return form.value.content || ''
  }
})

// ===== 博客预览渲染（使用全局 marked + m3Renderer，与发布效果一致）=====
const showPreviewDialog = ref(false)

const previewHtml = computed(() => {
  try {
    return globalMarked.parse(form.value.content || '')
  } catch {
    return form.value.content || ''
  }
})

function onPreview() {
  showPreviewDialog.value = true
}

function closePreview() {
  showPreviewDialog.value = false
}

// ===== 字符/行统计 =====
const charCount = computed(() => (form.value.content || '').length)
const lineCount = computed(() => {
  const c = form.value.content || ''
  return c ? c.split('\n').length : 0
})
const wordCount = computed(() => {
  const c = form.value.content || ''
  if (!c.trim()) return 0
  // 中英文混合统计：CJK 字符单独计，英文按空格分词
  const cjk = (c.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const enWords = c.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return cjk + enWords
})
const readTime = computed(() => {
  const w = wordCount.value
  return Math.max(1, Math.ceil(w / 250))
})

// ===== 大纲提取 =====
const outlineHeadings = computed(() => {
  const lines = (form.value.content || '').split('\n')
  const headings = []
  lines.forEach((line, idx) => {
    const h2Match = line.match(/^##\s+(.+)/)
    const h3Match = line.match(/^###\s+(.+)/)
    if (h2Match) headings.push({ level: 2, text: h2Match[1].replace(/[*_`~]/g, '').trim(), line: idx })
    else if (h3Match) headings.push({ level: 3, text: h3Match[1].replace(/[*_`~]/g, '').trim(), line: idx })
  })
  return headings
})

// ===== 编辑器 Tag 管理 =====
const formTags = computed(() => {
  return form.value.tagsDisplay
    ? form.value.tagsDisplay.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    : []
})

function removeTag(tag) {
  const tags = formTags.value.filter(t => t !== tag)
  form.value.tagsDisplay = tags.join(', ')
}

function addTag() {
  const val = newTagValue.value.trim()
  if (!val) return
  const tags = [...formTags.value]
  if (!tags.includes(val)) {
    tags.push(val)
    form.value.tagsDisplay = tags.join(', ')
  }
  newTagValue.value = ''
  showTagInput.value = false
}

// ===== Category 选项（从全部文章的 tags 去重获取） =====
const editorCategoryOptions = computed(() => {
  const tagSet = new Set()
  articles.value.forEach(a => {
    const tags = Array.isArray(a.tags) ? a.tags : []
    tags.forEach(t => tagSet.add(t))
  })
  return [...tagSet].sort()
})

function setCategory(cat) {
  const tags = [...formTags.value]
  // 替换第一个 tag（主分类）
  if (tags.length > 0) {
    tags[0] = cat
  } else {
    tags.push(cat)
  }
  form.value.tagsDisplay = tags.join(', ')
}

function scrollToHeading(lineIdx) {
  const ta = textareaRef.value
  if (!ta) return
  const lines = ta.value.split('\n')
  let pos = 0
  for (let i = 0; i < lineIdx; i++) pos += lines[i].length + 1
  ta.focus()
  ta.setSelectionRange(pos, pos)
  ta.scrollTop = pos * 0.6
}

function removeHeading(lineIdx) {
  const lines = (form.value.content || '').split('\n')
  // 只移除 heading 标记前缀，保留内容
  lines[lineIdx] = lines[lineIdx].replace(/^#{1,6}\s+/, '')
  form.value.content = lines.join('\n')
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function toggleMarkdownMode() {
  const modes = ['edit', 'split', 'preview']
  const idx = modes.indexOf(markdownTab.value)
  markdownTab.value = modes[(idx + 1) % modes.length]
}

// ===== 筛选 =====
const filteredArticles = computed(() => {
  let result = articles.value
  if (showPublishedFilter.value === 'published') result = result.filter(a => a.publishedAt)
  if (showPublishedFilter.value === 'draft') result = result.filter(a => !a.publishedAt)
  if (showPublishedFilter.value === 'scheduled') result = result.filter(a => a.date && new Date(a.date) > new Date())
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    )
  }
  if (categoryFilter.value) {
    const cat = categoryFilter.value.toLowerCase()
    result = result.filter(a => {
      const tags = Array.isArray(a.tags) ? a.tags : []
      // exact match on tag text
      return tags.some(t => (t || '').toLowerCase() === cat)
    })
  }
  if (tagFilter.value) {
    const tg = tagFilter.value.toLowerCase()
    result = result.filter(a => {
      const tags = Array.isArray(a.tags) ? a.tags : []
      return tags.some(t => (t || '').toLowerCase().includes(tg))
    })
  }
  result = [...result].sort((a, b) => {
    const da = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const db = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return sortAsc.value ? da - db : db - da
  })
  return result
})

const publishedCount = computed(() => articles.value.filter(a => a.publishedAt).length)
const draftCount = computed(() => articles.value.filter(a => !a.publishedAt).length)

function findOriginalIndex(art) {
  return articles.value.findIndex(a => a.documentId === art.documentId)
}

// ===== 数据加载 =====
const LIST_PARAMS = { pageSize: 100, sort: ['sortOrder:asc', 'createdAt:desc'] }

function loadArticles() {
  loader.loadWithRetry(
    props.token, UID, LIST_PARAMS,
    (results) => { articles.value = results }
  )
}

async function reloadArticles() {
  await loader.silentReload(props.token, UID, LIST_PARAMS, (results) => {
    articles.value = results
  })
}

onMounted(loadArticles)

// ===== Click-outside: 关闭所有下拉菜单 =====
function handleClickOutside(e) {
  if (headingMenuOpen.value && !e.target.closest('.ed-toolbar__heading-btn, .ed-toolbar__heading-menu')) {
    headingMenuOpen.value = false
  }
  if (statusDropdownEditorOpen.value && !e.target.closest('.ed-settings__dropdown, .ed-settings__dropdown-menu')) {
    statusDropdownEditorOpen.value = false
  }
  if (categoryEditorOpen.value && !e.target.closest('.ed-settings__category-dropdown')) {
    categoryEditorOpen.value = false
  }
  if (statusDropdownOpen.value && !e.target.closest('.am-dropdown, .am-dropdown-menu')) {
    statusDropdownOpen.value = false
  }
  if (categoryDropdownOpen.value && !e.target.closest('.am-dropdown, .am-dropdown-menu')) {
    categoryDropdownOpen.value = false
  }
  if (tagDropdownOpen.value && !e.target.closest('.am-dropdown, .am-dropdown-menu')) {
    tagDropdownOpen.value = false
  }
}
document.addEventListener('click', handleClickOutside, true)
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside, true))

// ===== 编辑操作 =====
function onCreate() {
  editingIndex.value = -2  // -2 表示新建模式（<0 且 ≠ -1，触发编辑器 v-if）
  form.value = {
    title: '',
    slug: '',
    description: '',
    content: '',
    date: '',
    sortOrder: articles.value.length,
    tagsDisplay: '',
    isPublished: false,
    featuredImage: '',
    featuredImageAlt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  }
  markdownTab.value = 'edit'
  lastSavedAt.value = ''
}

function onEdit(i) {
  if (i < 0 || i >= articles.value.length) return
  const art = articles.value[i]
  editingIndex.value = i
  const tags = Array.isArray(art.tags) ? art.tags : []
  form.value = {
    title: art.title || '',
    slug: art.slug || '',
    description: art.description || '',
    content: art.content || '',
    date: art.date || '',
    sortOrder: art.sortOrder ?? 0,
    tagsDisplay: tags.join(', '),
    isPublished: !!art.publishedAt,
    featuredImage: art.featuredImage || '',
    featuredImageAlt: art.featuredImageAlt || '',
    seoTitle: art.seoTitle || '',
    seoDescription: art.seoDescription || '',
    seoKeywords: art.seoKeywords || '',
  }
  markdownTab.value = 'edit'
  lastSavedAt.value = ''
}

function closeEditor() {
  editingIndex.value = -1
}

// ===== 保存 =====
function collectFormData(publish) {
  const title = form.value.title.trim()
  const slug = form.value.slug.trim()
  const description = form.value.description.trim()
  const content = form.value.content
  const date = form.value.date
  const sortOrder = form.value.sortOrder ?? 0
  const tags = formTags.value
  const featuredImage = form.value.featuredImage || undefined
  const featuredImageAlt = form.value.featuredImageAlt || undefined

  return { title, slug, description, content, date, sortOrder, tags, featuredImage, featuredImageAlt, publishedAt: publish ? new Date().toISOString() : null }
}

async function onSaveDraft() {
  const data = collectFormData(false)
  saving.value = true
  try {
    if (editingIndex.value >= 0) {
      const docId = articles.value[editingIndex.value].documentId
      await cmUpdate(props.token, UID, docId, data)
      showNotice('草稿已保存')
    } else {
      const result = await cmCreate(props.token, UID, data)
      showNotice('草稿已创建')
    }
    lastSavedAt.value = 'just now'
    setTimeout(() => { lastSavedAt.value = '2 minutes ago' }, 120000)
    await reloadArticles()
  } catch (e) {
    showNotice('保存失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

async function onSavePublish() {
  const data = collectFormData(true)
  saving.value = true
  try {
    if (editingIndex.value >= 0) {
      const docId = articles.value[editingIndex.value].documentId
      await cmUpdate(props.token, UID, docId, data)
      showNotice('文章已发布')
    } else {
      await cmCreate(props.token, UID, data)
      showNotice('文章已创建并发布')
    }
    form.value.isPublished = true
    lastSavedAt.value = 'just now'
    setTimeout(() => { lastSavedAt.value = '2 minutes ago' }, 120000)
    await reloadArticles()
  } catch (e) {
    showNotice('保存失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

// ===== 删除 =====
function onRemove(i) {
  deleteTarget.value = articles.value[i]
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await cmDelete(props.token, UID, deleteTarget.value.documentId)
    showDeleteConfirm.value = false
    if (editingIndex.value >= 0 && articles.value[editingIndex.value]?.documentId === deleteTarget.value?.documentId) {
      editingIndex.value = -1
    }
    deleteTarget.value = null
    showNotice('文章已删除')
    await reloadArticles()
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

// ===== Markdown 工具栏插入 =====
function onTextareaInput(e) {
  form.value.content = e.target.value
}

function insertMd(type) {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const sel = ta.value.substring(start, end)
  let before = '', after = '', newCursorOffset = 0

  switch (type) {
    case 'paragraph':
      // 移除当前行的 heading 前缀
      {
        const lines = ta.value.split('\n')
        let lineStart = ta.value.substring(0, start).lastIndexOf('\n') + 1
        const currentLineIdx = ta.value.substring(0, lineStart).split('\n').length - 1
        const currentLine = lines[currentLineIdx] || ''
        const headingMatch = currentLine.match(/^(#{1,6}\s+)/)
        if (headingMatch) {
          lines[currentLineIdx] = currentLine.replace(/^#{1,6}\s+/, '')
          form.value.content = lines.join('\n')
          requestAnimationFrame(() => ta.focus())
        }
        return
      }
    case 'h1':
      before = '# '; after = ''; newCursorOffset = before.length; break
    case 'h2':
    case 'heading':
      before = '## '; after = ''; newCursorOffset = before.length; break
    case 'h3':
      before = '### '; after = ''; newCursorOffset = before.length; break
    case 'h4':
      before = '#### '; after = ''; newCursorOffset = before.length; break
    case 'bold':
      before = '**'; after = '**'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'italic':
      before = '*'; after = '*'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'strikethrough':
      before = '~~'; after = '~~'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'link':
      before = '['; after = '](url)'; newCursorOffset = before.length + (sel || 'text').length
      break
    case 'image':
      before = '!['; after = '](url)'; newCursorOffset = before.length + (sel || 'alt').length
      break
    case 'code':
      before = '`'; after = '`'; newCursorOffset = sel ? before.length + sel.length + after.length : before.length
      break
    case 'codeblock':
      before = '```\n'; after = '\n```'; newCursorOffset = before.length
      break
    case 'ul':
      before = '- '; after = ''; newCursorOffset = before.length
      break
    case 'ol':
      before = '1. '; after = ''; newCursorOffset = before.length
      break
    case 'quote':
      before = '> '; after = ''; newCursorOffset = before.length
      break
    case 'hr':
      before = '\n---\n'; after = ''; newCursorOffset = before.length
      break
    case 'table':
      before = '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| '; after = ' |  |  |\n'; newCursorOffset = before.length
      break
  }

  const replacement = before + sel + after
  const newContent = ta.value.substring(0, start) + replacement + ta.value.substring(end)
  form.value.content = newContent

  // 恢复光标位置
  requestAnimationFrame(() => {
    ta.focus()
    const cursorPos = sel ? start + newCursorOffset : start + newCursorOffset
    ta.setSelectionRange(cursorPos, cursorPos)
  })
}

// ===== 二级子导航数据 =====
const scheduledCount = computed(() => articles.value.filter(a => a.date && new Date(a.date) > new Date()).length)

const subnavArticles = computed(() => [
  { label: 'All Articles', value: 'all', count: articles.value.length, filter: 'all' },
  { label: 'Drafts', value: 'drafts', count: draftCount.value, filter: 'draft' },
  { label: 'Published', value: 'published', count: publishedCount.value, filter: 'published' },
  { label: 'Scheduled', value: 'scheduled', count: scheduledCount.value, filter: 'scheduled' },
])

// 动态提取所有文章中的 tag 及其文章数量
const subnavCategories = computed(() => {
  const tagMap = {}
  articles.value.forEach(a => {
    const tags = Array.isArray(a.tags) ? a.tags : []
    tags.forEach(t => {
      const display = t.trim()
      if (!display) return
      const key = display.toLowerCase()
      if (!tagMap[key]) tagMap[key] = { label: display, value: key, count: 0, color: getTagColorSet(display).color }
      tagMap[key].count++
    })
  })
  // 按出现次数降序排列
  return Object.values(tagMap).sort((a, b) => b.count - a.count)
})

// ===== 分页 =====
const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticles.value.length / pageSize)))
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredArticles.value.slice(start, start + pageSize)
})
const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  return pages
})

// 筛选条件变化时重置到第 1 页
watch([searchQuery, categoryFilter, tagFilter, showPublishedFilter], () => {
  currentPage.value = 1
})

// ===== 选择 =====
const allSelected = computed(() => {
  if (!paginatedArticles.value.length) return false
  return paginatedArticles.value.every(a => selectedIds.value.has(a.documentId))
})

function toggleSelectAll(event) {
  const checked = event.target.checked
  if (checked) {
    paginatedArticles.value.forEach(a => selectedIds.value.add(a.documentId))
  } else {
    paginatedArticles.value.forEach(a => selectedIds.value.delete(a.documentId))
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelect(documentId) {
  if (selectedIds.value.has(documentId)) {
    selectedIds.value.delete(documentId)
  } else {
    selectedIds.value.add(documentId)
  }
  selectedIds.value = new Set(selectedIds.value)
}

// ===== 批量操作 =====
async function bulkPublish() {
  saving.value = true
  try {
    const ids = [...selectedIds.value]
    for (const id of ids) {
      const art = articles.value.find(a => a.documentId === id)
      if (art && !art.publishedAt) {
        await cmUpdate(props.token, UID, id, { publishedAt: new Date().toISOString() })
      }
    }
    showNotice(`已批量发布 ${ids.length} 篇文章`)
    selectedIds.value = new Set()
    await reloadArticles()
  } catch (e) {
    showNotice('批量发布失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

async function bulkDelete() {
  saving.value = true
  try {
    const ids = [...selectedIds.value]
    for (const id of ids) {
      await cmDelete(props.token, UID, id)
    }
    showNotice(`已删除 ${ids.length} 篇文章`)
    selectedIds.value = new Set()
    await reloadArticles()
  } catch (e) {
    showNotice('批量删除失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

function toggleSort() {
  sortAsc.value = !sortAsc.value
}

// ===== 辅助函数 =====
function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function getVisibleTags(tags) {
  if (!tags || !tags.length) return []
  return tags.slice(0, 2)
}

function getReadTime(content) {
  if (!content) return '1 min read'
  const words = content.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}
</script>

<style scoped>
.article-manager {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  min-height: 100dvh;
  background: var(--md-sys-color-surface, #F8F9FC);
}

/* ======== 缓冲进度条 ======== */
.loading-progress {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  transition: opacity 400ms ease-out;
}

.loading-progress--fading {
  opacity: 0;
}

/* ======== 骨架屏 ======== */
.skeleton-container {
  padding: 0;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--md-sys-color-surface-container-high, #ece7e9) 0%,
    var(--md-sys-color-surface-container-highest, #e6e0e9) 50%,
    var(--md-sys-color-surface-container-high, #ece7e9) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton--topbar {
  height: 56px;
  margin-bottom: 0;
  border-radius: 0;
}

.skeleton-body {
  padding: 24px 32px;
}

.skeleton--page-title {
  height: 28px;
  width: 200px;
  margin-bottom: 24px;
}

.skeleton--filter-bar {
  height: 40px;
  width: 100%;
  margin-bottom: 16px;
}

.skeleton--row {
  height: 72px;
  width: 100%;
  margin-bottom: 8px;
}

/* ======== 两栏布局 ======== */
.am-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ======== 二级子导航面板 ======== */
.am-subnav {
  width: 240px;
  flex-shrink: 0;
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 12px;
  margin: 16px 0 16px 16px;
  padding: 16px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  align-self: flex-start;
  position: sticky;
  top: 0;
  max-height: 100dvh;
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline-variant, #c4c0c8) transparent;
}

.am-subnav::-webkit-scrollbar {
  width: 6px;
}

.am-subnav::-webkit-scrollbar-track {
  background: transparent;
}

.am-subnav::-webkit-scrollbar-thumb {
  background-color: var(--md-sys-color-outline-variant, #c4c0c8);
  border-radius: 3px;
}

.am-subnav__group {
  padding: 0 16px;
}

.am-subnav__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 8px;
}

.am-subnav__group-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
}

.am-subnav__group-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
}

.am-subnav__group-edit:hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f4f6);
}

.am-subnav__group-edit .material-symbols-rounded {
  font-size: 16px;
}

.am-subnav__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface, #374151);
  cursor: pointer;
  transition: all 100ms;
  font-family: inherit;
  width: 100%;
  text-align: left;
}

.am-subnav__item:hover {
  background-color: var(--md-sys-color-surface-container-high, #f9fafb);
}

.am-subnav__item--active {
  background-color: var(--md-sys-color-primary-container, #f3f0ff);
  color: var(--md-sys-color-primary, #635bff);
}

.am-subnav__item--active .am-subnav__item-count {
  color: var(--md-sys-color-primary, #635bff);
}

.am-subnav__item-label {
  flex: 1;
}

.am-subnav__item-count {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-subnav__cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.am-subnav__divider {
  height: 1px;
  background-color: var(--md-sys-color-outline-variant, #e5e7eb);
  margin: 12px 16px;
}

.am-subnav__expand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  margin-top: 4px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 100ms;
  font-family: inherit;
  padding: 0;
}

.am-subnav__expand:hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f4f6);
}

.am-subnav__expand-dots {
  font-size: 14px;
  letter-spacing: 2px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  user-select: none;
}

/* tag 颜色编辑对话框中的颜色点按钮 */
.tag-color-dot-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 150ms;
  padding: 0;
}
.tag-color-dot-btn:hover {
  transform: scale(1.2);
}
.tag-color-dot-btn--active {
  border-color: var(--md-sys-color-on-surface, #111827);
  box-shadow: 0 0 0 1px var(--md-sys-color-surface-container-lowest, #fff);
}

/* ======== 主内容区 ======== */
.am-main {
  flex: 1;
  padding: 16px 24px;
  min-width: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline-variant, #c4c0c8) transparent;
}

.am-main::-webkit-scrollbar {
  width: 6px;
}

.am-main::-webkit-scrollbar-track {
  background: transparent;
}

.am-main::-webkit-scrollbar-thumb {
  background-color: var(--md-sys-color-outline-variant, #c4c0c8);
  border-radius: 3px;
}

/* ======== 页面标题 ======== */
.am-page-header {
  margin-bottom: 16px;
}

.am-page-header__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
  margin: 0 0 4px;
  line-height: 32px;
}

.am-page-header__subtitle {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  margin: 0;
  line-height: 20px;
}

/* ======== 筛选栏 ======== */
.am-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.am-filter-bar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  flex: 0 1 320px;
}

.am-filter-bar__search .material-symbols-rounded {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.am-filter-bar__search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--md-sys-color-on-surface, #374151);
  flex: 1;
  min-width: 0;
  font-family: inherit;
}

.am-filter-bar__search-input::placeholder {
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.am-filter-bar__spacer {
  flex: 1;
}

/* ======== 下拉选择器 ======== */
.am-dropdown {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface, #374151);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-dropdown:hover {
  border-color: var(--md-sys-color-primary, #635bff);
}

.am-dropdown__chevron {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface, #374151);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-sort-btn:hover {
  border-color: var(--md-sys-color-primary, #635bff);
  color: var(--md-sys-color-primary, #635bff);
}

.am-sort-btn .material-symbols-rounded {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-view-toggle {
  display: flex;
  height: 40px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.am-view-toggle__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  border: none;
  background: var(--md-sys-color-surface-container-lowest, #fff);
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
}

.am-view-toggle__btn:first-child {
  border-right: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
}

.am-view-toggle__btn--active {
  background-color: var(--md-sys-color-primary-container, #f3f0ff);
  color: var(--md-sys-color-primary, #635bff);
}

.am-view-toggle__btn .material-symbols-rounded {
  font-size: 16px;
}

/* ======== 文章列表表格 ======== */
.am-table {
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border: 1px solid var(--md-sys-color-outline-variant, #f3f4f6);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* ======== 文章行（无表头） ======== */
.am-article-row {
  display: grid;
  grid-template-columns: 40px 1fr 110px 110px 90px 180px 40px;
  align-items: center;
  height: 88px;
  padding: 0 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #f3f4f6);
  cursor: pointer;
  transition: background-color 100ms;
  gap: 12px;
}

.am-article-row:last-of-type {
  border-bottom: none;
}

.am-article-row:hover {
  background-color: var(--md-sys-color-surface-container, #f3edf7);
}

.am-article-row--selected {
  background-color: var(--md-sys-color-primary-container, #f3f0ff);
}

.am-article-row--selected:hover {
  background-color: var(--md-sys-color-primary-container, #e8e3ff);
}

/* Article column with thumbnail + title/desc */
.am-article-row__col-article {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.am-article-row__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  flex-shrink: 0;
}

.am-article-row__thumb--published {
  background-color: #ecfdf5;
  color: #065f46;
}

.am-article-row__thumb--draft {
  background-color: #fff7ed;
  color: #92400e;
}

.am-article-row__thumb .material-symbols-rounded {
  font-size: 28px;
}

.am-article-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.am-article-row__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 22px;
}

.am-article-row__desc {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 18px;
}

.am-article-row__col-date,
.am-article-row__col-readtime {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-article-row__col-tags {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
}

.am-tag-overflow {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  background-color: var(--md-sys-color-surface-container-high, #f3f4f6);
  white-space: nowrap;
  flex-shrink: 0;
}

.am-article-row__col-tags-placeholder {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.am-article-row__menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  cursor: pointer;
  transition: all 150ms;
}

.am-article-row__menu:hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f4f6);
  color: var(--md-sys-color-on-surface, #374151);
}

.am-article-row__menu .material-symbols-rounded {
  font-size: 16px;
}

/* ======== 自定义复选框 ======== */
.am-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.am-checkbox input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  margin: 0;
  z-index: 1;
}

.am-checkbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--md-sys-color-outline-variant, #d1d5db);
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  transition: all 150ms;
}

.am-checkbox__box::after {
  content: '';
  width: 10px;
  height: 10px;
  background-color: var(--md-sys-color-on-primary, #fff);
  border-radius: 1px;
  opacity: 0;
  transform: scale(0);
  transition: all 100ms;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0, 43% 62%);
}

.am-checkbox input:checked ~ .am-checkbox__box {
  background-color: var(--md-sys-color-primary, #635bff);
  border-color: var(--md-sys-color-primary, #635bff);
}

.am-checkbox input:checked ~ .am-checkbox__box::after {
  opacity: 1;
  transform: scale(1);
}

.am-checkbox input:focus-visible ~ .am-checkbox__box {
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.2);
}

/* ======== 状态标签 ======== */
.am-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* ======== 底部批量操作栏 + 分页（独立容器） ======== */
.am-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  margin-top: 12px;
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border: 1px solid var(--md-sys-color-outline-variant, #f3f4f6);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  gap: 12px;
}

.am-bottom-bar__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.am-bottom-bar__count {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.am-bottom-bar__actions {
  display: flex;
  gap: 8px;
}

.am-bottom-bar__btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface, #374151);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-bottom-bar__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.am-bottom-bar__btn:not(:disabled):hover {
  background-color: var(--md-sys-color-surface-container-high, #f3f4f6);
}

.am-bottom-bar__btn--icon {
  padding: 0;
  width: 32px;
  justify-content: center;
}

.am-bottom-bar__btn .material-symbols-rounded {
  font-size: 16px;
}

.am-bottom-bar__btn--danger {
  color: #ef4444;
}

.am-bottom-bar__btn--danger:hover {
  background-color: #fef2f2;
  border-color: #fecaca;
}

/* ======== 分页 ======== */
.am-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.am-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  transition: all 150ms;
}

.am-pagination__btn:hover:not(:disabled) {
  border-color: var(--md-sys-color-primary, #635bff);
  color: var(--md-sys-color-primary, #635bff);
}

.am-pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.am-pagination__btn .material-symbols-rounded {
  font-size: 16px;
}

.am-pagination__page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background: var(--md-sys-color-surface-container-lowest, #fff);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #374151);
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}

.am-pagination__page:hover {
  border-color: var(--md-sys-color-primary, #635bff);
  color: var(--md-sys-color-primary, #635bff);
}

.am-pagination__page--active {
  background-color: var(--md-sys-color-primary, #635bff);
  border-color: var(--md-sys-color-primary, #635bff);
  color: var(--md-sys-color-on-primary, #fff);
}

.am-pagination__page--active:hover {
  background-color: var(--md-sys-color-primary, #635bff);
  color: var(--md-sys-color-on-primary, #fff);
}

/* ======== 空状态 ======== */
.am-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background-color: var(--md-sys-color-surface-container-lowest, #fff);
  border: 1px solid var(--md-sys-color-outline-variant, #f3f4f6);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.am-empty__icon {
  font-size: 48px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  opacity: 0.5;
  margin-bottom: 16px;
}

.am-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
  margin: 0 0 4px;
}

.am-empty__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  margin: 0;
}

/* ======== 编辑器区域 ======== */
.ed {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 16px);
  overflow: hidden;
}

/* ======== 编辑器 Topbar ======== */
.ed-topbar {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: var(--md-sys-color-surface, #fff);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  gap: 16px;
  flex-shrink: 0;
}

.ed-topbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.ed-topbar__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
}

.ed-topbar__back:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-topbar__back .material-symbols-rounded {
  font-size: 20px;
}

.ed-topbar__crumb {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  white-space: nowrap;
}

.ed-topbar__crumb:hover {
  color: var(--md-sys-color-primary, #635bff);
}

.ed-topbar__chevron {
  font-size: 16px;
  color: var(--md-sys-color-outline, #9ca3af);
}

.ed-topbar__current {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ed-topbar__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.ed-topbar__badge--draft {
  background: #fff1e0;
  color: #f59e0b;
}

.ed-topbar__badge--published {
  background: #ecfdf5;
  color: #065f46;
}

.ed-topbar__center {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ed-topbar__save-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.ed-topbar__save-check {
  font-size: 12px;
  color: #10b981;
}

.ed-topbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ======== 编辑器通用按钮 ======== */
.ed-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s;
}

.ed-btn .material-symbols-rounded {
  font-size: 16px;
}

.ed-btn--outlined {
  background: var(--md-sys-color-surface, #fff);
  border-color: var(--md-sys-color-outline-variant, #e5e7eb);
  color: var(--md-sys-color-on-surface, #374151);
}

.ed-btn--outlined:hover {
  background: var(--md-sys-color-surface-container, #f9fafb);
}

.ed-btn--filled {
  background: var(--md-sys-color-primary, #635bff);
  color: #fff;
  border-color: transparent;
}

.ed-btn--filled:hover {
  background: var(--md-sys-color-primary, #5548e8);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ed-btn__arrow {
  font-size: 14px;
}

.ed-btn--sm {
  padding: 6px 12px;
  font-size: 13px;
}

.ed-btn--icon-only {
  padding: 6px;
  width: 32px;
  height: 32px;
  justify-content: center;
}

/* ======== 编辑器三栏主体 ======== */
.ed-body {
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-low, #fafbfc);
}

/* ======== 左栏：大纲 Outline ======== */
.ed-outline {
  background: var(--md-sys-color-surface, #fff);
  border-right: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ed-outline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  flex-shrink: 0;
}

.ed-outline__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
}

.ed-outline__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  border-radius: 6px;
}

.ed-outline__add:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-outline__add .material-symbols-rounded {
  font-size: 18px;
}

.ed-outline__list {
  padding: 0 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ed-outline__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface, #111827);
  text-align: left;
  gap: 6px;
  transition: background 0.12s;
}

.ed-outline__item:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-outline__item--h3 {
  padding-left: 26px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

.ed-outline__item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ed-outline__item-remove {
  visibility: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
}

.ed-outline__item-remove .material-symbols-rounded {
  font-size: 14px;
}

.ed-outline__item:hover .ed-outline__item-remove {
  visibility: visible;
}

.ed-outline__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

/* ======== 中栏：主编辑区 ======== */
.ed-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--md-sys-color-surface, #fff);
}

/* 格式化工具栏 */
.ed-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  gap: 2px;
  flex-shrink: 0;
}

.ed-toolbar__left {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.ed-toolbar__right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.ed-toolbar__heading-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  white-space: nowrap;
}

.ed-toolbar__heading-btn:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-toolbar__heading-btn .material-symbols-rounded {
  font-size: 14px;
}

/* Heading dropdown */
.ed-toolbar__heading-wrap {
  position: relative;
}

.ed-toolbar__heading-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 160px;
  background: var(--md-sys-color-surface, #fff);
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  z-index: 100;
  overflow: hidden;
  padding: 4px 0;
}

.ed-toolbar__heading-option {
  display: block;
  width: 100%;
  padding: 6px 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--md-sys-color-on-surface, #111827);
}

.ed-toolbar__heading-option:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-toolbar__heading-option--active {
  background: var(--md-sys-color-primary-container, #eef1ff);
  color: var(--md-sys-color-primary, #635bff);
}

.ed-toolbar__heading-preview {
  display: block;
}

.ed-toolbar__heading-preview--paragraph { font-size: 14px; font-weight: 400; }
.ed-toolbar__heading-preview--h1 { font-size: 20px; font-weight: 700; }
.ed-toolbar__heading-preview--h2 { font-size: 18px; font-weight: 600; }
.ed-toolbar__heading-preview--h3 { font-size: 16px; font-weight: 600; }
.ed-toolbar__heading-preview--h4 { font-size: 14px; font-weight: 600; }

.ed-toolbar__icon-btn--active {
  background: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.ed-toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--md-sys-color-outline-variant, #e5e7eb);
  margin: 0 6px;
  align-self: center;
}

.ed-toolbar__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: background 0.12s;
}

.ed-toolbar__icon-btn:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
  color: var(--md-sys-color-on-surface, #111827);
}

.ed-toolbar__icon-btn .material-symbols-rounded {
  font-size: 18px;
}

/* 内容区 */
.ed-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ed-content__title {
  width: 100%;
  padding: 24px 48px 0;
  border: none;
  background: transparent;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--md-sys-color-on-surface, #111827);
  outline: none;
  line-height: 1.3;
}

.ed-content__title::placeholder {
  color: var(--md-sys-color-outline, #9ca3af);
}

.ed-content__excerpt {
  width: 100%;
  padding: 8px 48px 0;
  border: none;
  background: transparent;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  outline: none;
  line-height: 1.5;
}

.ed-content__excerpt::placeholder {
  color: var(--md-sys-color-outline, #c9cdd4);
}

.ed-content__editor-body {
  flex: 1;
  min-height: 300px;
  overflow: hidden;
  display: flex;
}

.ed-content__editor-body--edit {
  display: block;
}

.ed-content__editor-body--preview {
  display: block;
  overflow-y: auto;
}

.ed-content__editor-body--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.ed-content__editor-body--split .ed-content__textarea {
  border-right: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
}

.ed-content__textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 16px 48px 24px;
  border: none;
  background: var(--md-sys-color-surface, #fff);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  font-family: 'Google Sans', 'Noto Sans SC', 'Google Sans Mono', monospace;
  font-size: 15px;
  line-height: 1.7;
  resize: none;
  outline: none;
  box-sizing: border-box;
  tab-size: 2;
}

.ed-content__preview {
  width: 100%;
  padding: 16px 48px 24px;
  background: var(--md-sys-color-surface, #fff);
  overflow-y: auto;
  min-height: 400px;
  font-family: 'Google Sans', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* 底部状态栏 */
.ed-bottombar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  height: 40px;
  border-top: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  background: var(--md-sys-color-surface, #fff);
  flex-shrink: 0;
}

.ed-bottombar__left {
  display: flex;
  align-items: center;
}

.ed-bottombar__mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
}

.ed-bottombar__mode-btn:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-bottombar__mode-btn .material-symbols-rounded {
  font-size: 14px;
}

.ed-bottombar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ed-bottombar__stat {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  white-space: nowrap;
}

.ed-bottombar__icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
}

.ed-bottombar__icon-btn:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-bottombar__icon-btn .material-symbols-rounded {
  font-size: 14px;
}

/* ======== 右栏：文档设置 ======== */
.ed-settings {
  background: var(--md-sys-color-surface, #fff);
  border-left: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ed-settings__tabs {
  display: flex;
  gap: 4px;
  padding: 16px 16px 0;
  flex-shrink: 0;
}

.ed-settings__tab {
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.12s, color 0.12s;
}

.ed-settings__tab:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-settings__tab--active {
  background: var(--md-sys-color-primary-container, #eef1ff);
  color: var(--md-sys-color-primary, #635bff);
}

.ed-settings__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ed-settings__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ed-settings__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #111827);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ed-settings__section-arrow {
  font-size: 18px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  transition: transform 0.2s;
}

.ed-settings__section-arrow--open {
  transform: rotate(180deg);
}

.ed-settings__section--collapsible {
  cursor: pointer;
  padding: 12px 0;
  border-top: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
}

.ed-settings__section--collapsible:hover .ed-settings__section-title {
  color: var(--md-sys-color-primary, #635bff);
}

.ed-settings__section--danger {
  padding-top: 16px;
  border-top: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
}

/* Dropdown */
.ed-settings__dropdown {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  height: 40px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 6px;
  background: var(--md-sys-color-surface, #fff);
  color: var(--md-sys-color-on-surface, #374151);
  font-size: 14px;
  cursor: pointer;
  gap: 8px;
}

.ed-settings__dropdown:hover {
  border-color: var(--md-sys-color-outline, #9ca3af);
}

.ed-settings__dropdown--sub {
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
  margin-top: 8px;
}

.ed-settings__dropdown .material-symbols-rounded {
  font-size: 16px;
}

.ed-settings__dropdown-arrow {
  margin-left: auto;
  font-size: 18px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
}

/* Status dot */
.ed-settings__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ed-settings__status-dot--draft {
  background: #f59e0b;
}

.ed-settings__status-dot--published {
  background: #10b981;
}

/* Dropdown menu */
.ed-settings__dropdown-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 6px;
  background: var(--md-sys-color-surface, #fff);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  z-index: 10;
  overflow: hidden;
}

.ed-settings__dropdown-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface, #374151);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.ed-settings__dropdown-menu button:hover {
  background: var(--md-sys-color-surface-container, #f3f4f6);
}

.ed-settings__helper {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  margin: 0;
}

/* Tags */
.ed-settings__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ed-settings__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--md-sys-color-primary-container, #eef1ff);
  color: var(--md-sys-color-primary, #635bff);
}

.ed-settings__tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: var(--md-sys-color-primary, #635bff);
  cursor: pointer;
  border-radius: 2px;
  padding: 0;
}

.ed-settings__tag-remove:hover {
  background: rgba(99, 91, 255, 0.15);
}

.ed-settings__tag-remove .material-symbols-rounded {
  font-size: 12px;
}

.ed-settings__tag-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  background: var(--md-sys-color-surface-container, #f3f4f6);
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
}

.ed-settings__tag-add:hover {
  background: var(--md-sys-color-surface-container-high, #e5e7eb);
}

.ed-settings__tag-add .material-symbols-rounded {
  font-size: 14px;
}

.ed-settings__tag-input-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.ed-settings__tag-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--md-sys-color-surface, #fff);
  color: var(--md-sys-color-on-surface, #111827);
}

.ed-settings__tag-input:focus {
  border-color: var(--md-sys-color-primary, #635bff);
}

.ed-settings__tag-input-confirm {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--md-sys-color-primary, #635bff);
  color: #fff;
  cursor: pointer;
  border-radius: 6px;
}

.ed-settings__tag-input-confirm .material-symbols-rounded {
  font-size: 16px;
}

/* Featured image */
.ed-settings__featured {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ed-settings__featured-placeholder {
  width: 100%;
  height: 80px;
  background: var(--md-sys-color-surface-container, #f3f4f6);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.ed-settings__featured-placeholder .material-symbols-rounded {
  font-size: 32px;
}

.ed-settings__featured-actions {
  display: flex;
  gap: 8px;
}

.ed-settings__alt-label {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #6b7280);
  margin-top: 4px;
}

.ed-settings__alt-input {
  width: 100%;
  padding: 8px 12px;
  height: 36px;
  border: 1px solid var(--md-sys-color-outline-variant, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--md-sys-color-surface, #fff);
  color: var(--md-sys-color-on-surface, #111827);
  box-sizing: border-box;
}

.ed-settings__alt-input:focus {
  border-color: var(--md-sys-color-primary, #635bff);
}

.ed-settings__alt-input::placeholder {
  color: var(--md-sys-color-outline, #9ca3af);
}

/* Delete button */
.ed-settings__delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  width: 100%;
}

.ed-settings__delete-btn:hover {
  background: #fef2f2;
}

.ed-settings__delete-btn .material-symbols-rounded {
  font-size: 18px;
}

/* Empty state */
.ed-settings__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--md-sys-color-on-surface-variant, #9ca3af);
}

.ed-settings__empty-state .material-symbols-rounded {
  font-size: 40px;
}

.ed-settings__empty-state p {
  margin: 0;
  font-size: 13px;
}

/* ======== 操作提示 ======== */
.operation-notice {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
  z-index: 200;
  animation: notice-enter 200ms ease;
}

.operation-notice--error {
  background: var(--md-sys-color-error-container, #f9dedc);
}

.operation-notice__icon {
  font-size: 20px;
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__icon {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

.operation-notice__text {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__text {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

@keyframes notice-enter {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ======== fadeIn 动画 ======== */
.content-fadein {
  animation: admin-fadein 200ms linear 200ms both;
}

@keyframes admin-fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ======== 响应式 ======== */
@media (max-width: 1280px) {
  .am-subnav {
    width: 200px;
  }

  .am-article-row {
    grid-template-columns: 40px 1fr 100px 100px 80px 150px 40px;
    gap: 8px;
  }
}

@media (max-width: 1024px) {
  .am-subnav {
    display: none;
  }

  .am-article-row {
    grid-template-columns: 40px 1fr 90px 80px 40px;
  }

  .am-article-row__col-readtime,
  .am-article-row__col-tags {
    display: none;
  }

  .am-main {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .am-article-row {
    grid-template-columns: 32px 1fr 70px 40px;
    height: 64px;
    gap: 8px;
  }

  .am-article-row__col-readtime,
  .am-article-row__col-tags,
  .am-article-row__col-status {
    display: none;
  }

  .am-article-row__thumb {
    width: 36px;
    height: 36px;
  }

  .am-article-row__thumb .material-symbols-rounded {
    font-size: 18px;
  }

  .am-filter-bar {
    flex-wrap: wrap;
  }

  .am-bottom-bar {
    flex-direction: column;
    height: auto;
    padding: 8px 12px;
    gap: 8px;
  }
}

@media (max-width: 1294px) {
  .ed-body {
    grid-template-columns: 1fr 320px;
  }
  .ed-outline {
    display: none;
  }
}

@media (max-width: 840px) {
  .ed-body {
    grid-template-columns: 1fr;
  }
  .ed-settings {
    display: none;
  }
  .ed-content__title,
  .ed-content__excerpt,
  .ed-content__textarea,
  .ed-content__preview {
    padding-left: 24px;
    padding-right: 24px;
  }
}
</style>

<!-- 非scoped样式：硬编码颜色 + 暗色主题覆盖 -->
<style>
/* ======== 状态标签颜色 ======== */
.am-status-tag--published {
  background: #ecfdf5;
  color: #065f46;
}

.am-status-tag--draft {
  background: #fff7ed;
  color: #92400e;
}

/* ======== 暗色主题：状态标签 ======== */
[data-theme="dark"] .am-status-tag--published {
  background: #06381f;
  color: #34d399;
}

[data-theme="dark"] .am-status-tag--draft {
  background: #3a2200;
  color: #fbbf24;
}

/* ======== 暗色主题：缩略图 ======== */
[data-theme="dark"] .am-article-row__thumb--published {
  background: #06381f;
  color: #34d399;
}

[data-theme="dark"] .am-article-row__thumb--draft {
  background: #3a2200;
  color: #fbbf24;
}

/* ======== 暗色主题：表格边框 ======== */
[data-theme="dark"] .am-table {
  border-color: var(--md-sys-color-outline-variant, #49454f);
}

/* ======== 暗色主题：滚动条 ======== */
[data-theme="dark"] .am-subnav,
[data-theme="dark"] .am-main {
  scrollbar-color: var(--md-sys-color-outline-variant, #49454f) transparent;
}

[data-theme="dark"] .am-subnav::-webkit-scrollbar-thumb,
[data-theme="dark"] .am-main::-webkit-scrollbar-thumb {
  background-color: var(--md-sys-color-outline-variant, #49454f);
}

/* ======== 暗色主题：accent 相关（已通过 CSS 变量自动切换，无需额外覆盖）===== */

[data-theme="dark"] .am-bottom-bar {
  background-color: var(--md-sys-color-surface-container-lowest, #141218);
  border-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .am-empty {
  border-color: var(--md-sys-color-outline-variant, #49454f);
}

/* ======== 暗色主题：编辑器 ======== */
[data-theme="dark"] .ed-topbar {
  background: var(--md-sys-color-surface, #1d1b20);
  border-bottom-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-topbar__badge--draft {
  background: #422006;
  color: #fbbf24;
}

[data-theme="dark"] .ed-topbar__badge--published {
  background: #064e3b;
  color: #6ee7b7;
}

[data-theme="dark"] .ed-body {
  background: var(--md-sys-color-surface-container-low, #141218);
}

[data-theme="dark"] .ed-outline {
  background: var(--md-sys-color-surface, #1d1b20);
  border-right-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-outline__item:hover {
  background: var(--md-sys-color-surface-container, #2b2930);
}

[data-theme="dark"] .ed-main {
  background: var(--md-sys-color-surface, #1d1b20);
}

[data-theme="dark"] .ed-toolbar {
  border-bottom-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-toolbar__icon-btn:hover,
[data-theme="dark"] .ed-toolbar__heading-btn:hover,
[data-theme="dark"] .ed-bottombar__mode-btn:hover,
[data-theme="dark"] .ed-bottombar__icon-btn:hover {
  background: var(--md-sys-color-surface-container, #2b2930);
}

[data-theme="dark"] .ed-content__textarea {
  background: var(--md-sys-color-surface, #141218);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-content__preview {
  background: var(--md-sys-color-surface, #141218);
}

[data-theme="dark"] .ed-content__title {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-content__title::placeholder {
  color: var(--md-sys-color-outline, #6b7280);
}

[data-theme="dark"] .ed-bottombar {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-settings {
  background: var(--md-sys-color-surface, #1d1b20);
  border-left-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-settings__tab--active {
  background: var(--md-sys-color-primary-container, #4a4458);
  color: var(--md-sys-color-on-primary-container, #d0bcff);
}

[data-theme="dark"] .ed-settings__dropdown {
  background: var(--md-sys-color-surface-container, #2b2930);
  border-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-settings__dropdown-menu {
  background: var(--md-sys-color-surface-container, #2b2930);
  border-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-settings__dropdown-menu button:hover {
  background: var(--md-sys-color-surface-container-high, #36343b);
}

[data-theme="dark"] .ed-settings__tag {
  background: var(--md-sys-color-primary-container, #4a4458);
  color: var(--md-sys-color-on-primary-container, #d0bcff);
}

[data-theme="dark"] .ed-settings__tag-remove {
  color: var(--md-sys-color-on-primary-container, #d0bcff);
}

[data-theme="dark"] .ed-settings__tag-add {
  background: var(--md-sys-color-surface-container, #2b2930);
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

[data-theme="dark"] .ed-settings__tag-input {
  background: var(--md-sys-color-surface-container, #2b2930);
  border-color: var(--md-sys-color-outline-variant, #49454f);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-settings__alt-input {
  background: var(--md-sys-color-surface-container, #2b2930);
  border-color: var(--md-sys-color-outline-variant, #49454f);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-settings__featured-placeholder {
  background: var(--md-sys-color-surface-container, #2b2930);
}

[data-theme="dark"] .ed-settings__delete-btn:hover {
  background: #450a0a;
}

[data-theme="dark"] .ed-btn--outlined {
  background: var(--md-sys-color-surface, #1d1b20);
  border-color: var(--md-sys-color-outline-variant, #49454f);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-btn--outlined:hover {
  background: var(--md-sys-color-surface-container, #2b2930);
}

[data-theme="dark"] .ed-btn--filled {
  background: var(--md-sys-color-primary, #7c6fff);
}

[data-theme="dark"] .ed-settings__section--collapsible {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-settings__section--danger {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

/* ======== 暗色主题：编辑器面板滚动条 ======== */
[data-theme="dark"] .ed-outline::-webkit-scrollbar-track,
[data-theme="dark"] .ed-settings__body::-webkit-scrollbar-track,
[data-theme="dark"] .ed-content::-webkit-scrollbar-track,
[data-theme="dark"] .ed-content__preview::-webkit-scrollbar-track {
  background: transparent;
}

[data-theme="dark"] .ed-outline::-webkit-scrollbar-thumb,
[data-theme="dark"] .ed-settings__body::-webkit-scrollbar-thumb,
[data-theme="dark"] .ed-content::-webkit-scrollbar-thumb,
[data-theme="dark"] .ed-content__preview::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant, #49454f);
  border-radius: 4px;
}

[data-theme="dark"] .ed-outline::-webkit-scrollbar-thumb:hover,
[data-theme="dark"] .ed-settings__body::-webkit-scrollbar-thumb:hover,
[data-theme="dark"] .ed-content::-webkit-scrollbar-thumb:hover,
[data-theme="dark"] .ed-content__preview::-webkit-scrollbar-thumb:hover {
  background: var(--md-sys-color-on-surface-variant, #cac4d0);
}

/* 暗色主题：preview 文字颜色确保可读 */
[data-theme="dark"] .ed-content__preview {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

/* ======== 暗色主题：文章列表滚动条 ======== */
[data-theme="dark"] .am-main::-webkit-scrollbar-track {
  background: transparent;
}

[data-theme="dark"] .am-main::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant, #49454f);
  border-radius: 4px;
}

[data-theme="dark"] .am-main::-webkit-scrollbar-thumb:hover {
  background: var(--md-sys-color-on-surface-variant, #cac4d0);
}

[data-theme="dark"] .am-subnav::-webkit-scrollbar-track {
  background: transparent;
}

[data-theme="dark"] .am-subnav::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant, #49454f);
  border-radius: 4px;
}

/* ======== 博客预览弹窗（完全复刻 BlogArticleView 发布页面布局）===== */
.ed-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: var(--md-sys-color-surface, #fff);
  display: flex;
  flex-direction: column;
}

.ed-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  height: 56px;
  min-height: 56px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #e7e0ec);
  background: var(--md-sys-color-surface, #fff);
  flex-shrink: 0;
}

.ed-preview-toolbar__label {
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.ed-preview-toolbar__right {
  display: flex;
  gap: 8px;
}

/* 可滚动内容区 */
.ed-preview-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ---- mio-header（对照 BlogArticleView：双列 grid）---- */
.ed-preview-mio-header {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 0;
}

/* primary-container（对照 BlogArticleView：渐变背景 + padding）*/
.ed-preview-primary-container {
  display: flex;
  margin: 0;
  padding: 56px;
  border-radius: 24px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  background-repeat: no-repeat;
  background-position: 0 50%;
  background-size: cover;
  min-height: 544px;
}

.ed-preview-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 840px;
  margin: 0;
}

/* date（对照 BlogArticleView .date）*/
.ed-preview-date {
  font-family: var(--md-sys-typescale-article-desc-font-family);
  font-size: var(--md-sys-typescale-article-desc-font-size);
  font-weight: var(--md-sys-typescale-article-desc-font-weight);
  line-height: var(--md-sys-typescale-article-desc-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 16px;
  display: block;
}

/* title block（对照 BlogArticleView .title）*/
.ed-preview-title-block h1 {
  font-family: var(--md-sys-typescale-article-hero-font-family);
  font-size: var(--md-sys-typescale-article-hero-font-size);
  font-weight: var(--md-sys-typescale-article-hero-font-weight);
  line-height: var(--md-sys-typescale-article-hero-line-height);
  letter-spacing: var(--md-sys-typescale-article-hero-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-hero-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-hero-font-variation-opsz);
}

/* description（对照 BlogArticleView .description）*/
.ed-preview-description {
  font-family: var(--md-sys-typescale-article-desc-font-family);
  font-size: var(--md-sys-typescale-article-desc-font-size);
  font-weight: var(--md-sys-typescale-article-desc-font-weight);
  line-height: var(--md-sys-typescale-article-desc-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* split-asset-image（对照 BlogArticleView：渐变占位）*/
.ed-preview-split-asset-image {
  display: flex;
  position: relative;
  justify-content: center;
  border: 1px solid var(--md-sys-color-surface-variant, #e8e0e8);
  border-radius: 24px;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
  min-height: 544px;
}

.ed-preview-split-asset-image__foreground {
  display: flex;
  position: absolute;
  align-self: stretch;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #eaddff) 0%,
    var(--md-sys-color-secondary-container, #e8def8) 50%,
    var(--md-sys-color-tertiary-container, #ffd8e4) 100%
  );
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: contain;
}

/* ---- content-container（对照 BlogArticleView）---- */
.ed-preview-blog-content-container {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.ed-preview-blog-section {
  flex: 1 1 0%;
  min-width: 0;
  max-width: 840px;
}

/* authors（对照 BlogArticleView .authors）*/
.ed-preview-authors {
  margin: 80px 24px 0;
}

.ed-preview-overline {
  font-family: var(--md-sys-typescale-label-s-font-family);
  font-size: var(--md-sys-typescale-label-s-font-size);
  font-weight: var(--md-sys-typescale-label-s-font-weight);
  line-height: var(--md-sys-typescale-label-s-line-height);
  letter-spacing: var(--md-sys-typescale-label-s-letter-spacing);
  font-variation-settings: "GRAD" var(--md-sys-typescale-label-s-font-variation-GRAD), "opsz" var(--md-sys-typescale-label-s-font-variation-opsz);
  color: var(--md-sys-color-on-surface-variant, #4d4256);
  margin: 0 0 16px;
}

.ed-preview-byline {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 8px;
  font-family: var(--md-sys-typescale-article-body-font-family);
}

.ed-preview-author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.ed-preview-author-info {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  margin-left: 24px;
}

.ed-preview-author-name {
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  line-height: var(--md-sys-typescale-title-m-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.ed-preview-author-role {
  font-size: var(--md-sys-typescale-article-body-font-size);
  font-weight: var(--md-sys-typescale-article-body-font-weight);
  line-height: var(--md-sys-typescale-article-body-line-height);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.ed-preview-author-role::before {
  content: ', ';
}

/* separator（对照 BlogArticleView .separator）*/
.ed-preview-separator {
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant, #e8e0e8);
  margin: 80px 24px 56px;
}

/* ================================================================
   ed-preview-blog-content — 完全复用 BlogArticleView .blog-content 样式
   ================================================================ */
.ed-preview-blog-content {
  font-family: var(--md-sys-typescale-article-body-font-family);
  padding: 0 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* h2.linkable（m3Renderer 输出的 h2 带 linkable class） */
.ed-preview-blog-content h2.linkable {
  font-family: var(--md-sys-typescale-article-h2-font-family);
  font-size: var(--md-sys-typescale-article-h2-font-size);
  font-weight: var(--md-sys-typescale-article-h2-font-weight);
  line-height: var(--md-sys-typescale-article-h2-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h2-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h2-font-variation-opsz);
}

/* 兜底：没有 linkable class 的 h2 */
.ed-preview-blog-content h2 {
  font-family: var(--md-sys-typescale-article-h2-font-family);
  font-size: var(--md-sys-typescale-article-h2-font-size);
  font-weight: var(--md-sys-typescale-article-h2-font-weight);
  line-height: var(--md-sys-typescale-article-h2-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 48px 0 16px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h2-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h2-font-variation-opsz);
}

.ed-preview-blog-content h3 {
  font-family: var(--md-sys-typescale-article-h3-font-family);
  font-size: var(--md-sys-typescale-article-h3-font-size);
  font-weight: var(--md-sys-typescale-article-h3-font-weight);
  line-height: var(--md-sys-typescale-article-h3-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 48px 0 16px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h3-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h3-font-variation-opsz);
}

.ed-preview-blog-content h4 {
  font-family: var(--md-sys-typescale-article-h4-font-family);
  font-size: var(--md-sys-typescale-article-h4-font-size);
  font-weight: var(--md-sys-typescale-article-h4-font-weight);
  line-height: var(--md-sys-typescale-article-h4-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 32px 0 12px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h4-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h4-font-variation-opsz);
}

.ed-preview-blog-content h5 {
  font-family: var(--md-sys-typescale-article-h5-font-family);
  font-size: var(--md-sys-typescale-article-h5-font-size);
  font-weight: var(--md-sys-typescale-article-h5-font-weight);
  line-height: var(--md-sys-typescale-article-h5-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 24px 0 8px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h5-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h5-font-variation-opsz);
}

.ed-preview-blog-content h6 {
  font-family: var(--md-sys-typescale-article-h6-font-family);
  font-size: var(--md-sys-typescale-article-h6-font-size);
  font-weight: var(--md-sys-typescale-article-h6-font-weight);
  line-height: var(--md-sys-typescale-article-h6-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 24px 0 8px 0;
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-h6-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-h6-font-variation-opsz);
}

.ed-preview-blog-content p {
  font-size: var(--md-sys-typescale-article-body-font-size);
  font-weight: var(--md-sys-typescale-article-body-font-weight);
  line-height: var(--md-sys-typescale-article-body-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin-bottom: 24px;
}

/* ol 药丸数字徽章 */
.ed-preview-blog-content ol {
  padding-left: 0;
  list-style: none;
  counter-reset: item 0;
  margin-top: 16px;
}

.ed-preview-blog-content ol > li {
  margin-top: 4px;
  margin-bottom: 20px;
  margin-left: 36px;
  counter-increment: item 1;
}

.ed-preview-blog-content ol > li::before {
  font-family: var(--md-sys-typescale-article-ol-badge-font-family);
  font-size: var(--md-sys-typescale-article-ol-badge-font-size);
  font-weight: var(--md-sys-typescale-article-ol-badge-font-weight);
  letter-spacing: var(--md-sys-typescale-article-ol-badge-letter-spacing);
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-ol-badge-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-ol-badge-font-variation-opsz);
  display: block;
  width: 24px;
  height: 32px;
  margin-top: -4px;
  margin-right: 10px;
  margin-left: -36px;
  float: left;
  border-radius: 12px;
  background: var(--md-sys-color-inverse-surface, #323032);
  color: var(--md-sys-color-inverse-on-surface, #f2f2f2);
  line-height: 32px;
  text-align: center;
  content: counter(item);
}

/* ul 星形子弹 */
.ed-preview-blog-content ul {
  list-style: none;
  padding-left: 0;
  margin-left: 22px;
  margin-top: 16px;
}

.ed-preview-blog-content ul li {
  position: relative;
  margin-bottom: 16px;
}

.ed-preview-blog-content ul li::before {
  display: inline-block;
  position: absolute;
  top: 8px;
  left: -16px;
  width: 8px;
  height: 8px;
  transform: rotate(calc(var(--rotation, 0) * 36deg));
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.95843 0.279933C5.5378 -0.353974 6.58452 0.173492 6.41974 1.01632L6.05454 2.88412C5.99767 3.17501 6.09646 3.47451 6.31525 3.67447L7.72007 4.95843C8.35397 5.5378 7.82651 6.58452 6.98368 6.41974L5.11588 6.05454C4.82499 5.99767 4.52549 6.09646 4.32553 6.31525L3.04157 7.72007C2.4622 8.35397 1.41548 7.82651 1.58026 6.98368L1.94545 5.11588C2.00233 4.82499 1.90354 4.52549 1.68475 4.32553L0.279933 3.04157C-0.353974 2.4622 0.173492 1.41548 1.01632 1.58026L2.88412 1.94545C3.17501 2.00233 4.47451 1.90354 3.67447 1.68475L4.95843 0.279933Z' fill='%231E1E1C'/%3E%3C/svg%3E");
  line-height: 0;
  text-align: center;
  content: "";
}

.ed-preview-blog-content li {
  font-size: var(--md-sys-typescale-article-body-font-size);
  font-weight: var(--md-sys-typescale-article-body-font-weight);
  line-height: var(--md-sys-typescale-article-body-line-height);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.ed-preview-blog-content strong {
  font-weight: 600;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* inline code */
.ed-preview-blog-content code {
  font-family: var(--md-sys-typescale-article-code-font-family);
  font-size: var(--md-sys-typescale-article-code-font-size);
  font-weight: var(--md-sys-typescale-article-code-font-weight);
  line-height: var(--md-sys-typescale-article-code-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-code-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-code-font-variation-opsz);
  background: var(--md-sys-color-surface-container, #ece7e9);
  padding: 2px 8px;
  border-radius: 2px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

/* pre/code block */
.ed-preview-blog-content pre {
  font-family: 'Google Sans Mono', monospace;
  font-size: 15px;
  font-weight: 500;
  line-height: 32px;
  background: #fff;
  border: 1px solid var(--md-sys-color-surface-variant, #e8e0e8);
  border-radius: 16px;
  padding: 4px 0;
  margin: 56px 0 0;
  overflow-x: auto;
}

.ed-preview-blog-content pre code {
  font-family: 'Google Sans Mono', monospace;
  font-size: 15px;
  font-weight: 500;
  line-height: 32px;
  background: transparent;
  padding: 0 4px 0 24px;
  border-radius: 0;
  color: inherit;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
}

/* blockquote */
.ed-preview-blog-content blockquote {
  font-family: var(--md-sys-typescale-article-blockquote-font-family);
  font-size: var(--md-sys-typescale-article-blockquote-font-size);
  font-weight: var(--md-sys-typescale-article-blockquote-font-weight);
  line-height: var(--md-sys-typescale-article-blockquote-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-article-blockquote-font-variation-GRAD), "opsz" var(--md-sys-typescale-article-blockquote-font-variation-opsz);
  border-left: 4px solid var(--md-sys-color-primary);
  padding-left: 20px;
  margin: 56px 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* img */
.ed-preview-blog-content img {
  width: 100%;
  border-radius: 16px;
  margin: 24px 0;
}

/* links */
.ed-preview-blog-content a {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  border-radius: 4px;
  padding: 1px 2px;
  transition: background-color 0.15s ease;
}

.ed-preview-blog-content a:hover {
  background: var(--md-sys-color-primary-container);
}

/* hr */
.ed-preview-blog-content hr {
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  margin: 48px 0;
}

/* table */
.ed-preview-blog-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 24px;
  margin: 56px 0 0;
  border: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  border-radius: 24px;
  overflow: hidden;
}

.ed-preview-blog-content table th,
.ed-preview-blog-content table td {
  padding: 16px 24px;
  border-top: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  border-right: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
  vertical-align: middle;
  text-align: left;
}

.ed-preview-blog-content table th {
  font-family: 'Google Sans Text', 'Google Sans', 'Noto Sans SC', sans-serif;
  font-weight: 500;
  font-variation-settings: "GRAD" 0, "opsz" 17;
  background: var(--md-sys-color-surface-container-low, #f7f2fa);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.ed-preview-blog-content table thead tr:first-child th,
.ed-preview-blog-content table tbody tr:first-child td,
.ed-preview-blog-content table tbody tr:first-child th {
  border-top: 0;
}

.ed-preview-blog-content table tr th:last-child,
.ed-preview-blog-content table tr td:last-child {
  border-right: 0;
}

/* ================================================================
   copy-link 样式（m3Renderer 输出包含 .block/.copy-button 等）
   完全对齐 BlogArticleView
   ================================================================ */
.ed-preview-blog-content .block {
  display: grid;
  position: relative;
  grid-template-columns: 68px auto 0px 0px;
  gap: 20px;
  margin: 80px 0 24px -90px;
}

.ed-preview-blog-content .copy-button-container {
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  height: max-content;
  margin-left: 20px;
  margin-top: 2px;
  cursor: auto;
}

.ed-preview-blog-content .copy-button {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  border-radius: 24px;
  opacity: 0;
  z-index: 2;
  font-size: 24px;
  line-height: 24px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  cursor: pointer;
  overflow: hidden;
  user-select: none;
}

.ed-preview-blog-content .block:hover .copy-button,
.ed-preview-blog-content .copy-button:focus-visible,
.ed-preview-blog-content .copy-button:hover {
  opacity: 1;
}

.ed-preview-blog-content .copy-button-background {
  position: absolute;
  width: 48px;
  height: 48px;
  transition: 0.2s cubic-bezier(0.2, 0, 0, 1);
  border-radius: 24px;
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #49454f) 8%, transparent);
  opacity: 0;
  pointer-events: none;
  z-index: 1;
}

.ed-preview-blog-content .copy-button:focus-visible + .copy-button-background,
.ed-preview-blog-content .copy-button:focus-visible ~ .tooltip,
.ed-preview-blog-content .copy-button:hover + .copy-button-background,
.ed-preview-blog-content .copy-button:hover ~ .tooltip {
  opacity: 1;
}

/* activated 状态：背景变色 + tooltip 切换文字 */
.ed-preview-blog-content .copy-button.activated + .copy-button-background {
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
}

.ed-preview-blog-content .copy-button.activated ~ .tooltip {
  width: 86px;
}

.ed-preview-blog-content .copy-button.activated ~ .tooltip .deactivated {
  opacity: 0;
  visibility: hidden;
}

.ed-preview-blog-content .copy-button.activated ~ .tooltip .activated {
  opacity: 1;
  visibility: visible;
}

.ed-preview-blog-content .scroll-target {
  display: block;
  position: absolute;
  width: 0;
  height: 0;
}

.ed-preview-blog-content .tooltip {
  display: block;
  position: absolute;
  bottom: -28px;
  width: 74px;
  height: 24px;
  padding: 4px 11px;
  transition: 0.2s cubic-bezier(0.2, 0, 0, 1);
  border-radius: 6px;
  background: rgba(48, 48, 48, 0.8);
  color: var(--md-sys-color-inverse-on-surface, #f2f2f2);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.1px;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

.ed-preview-blog-content .tooltip .deactivated {
  position: absolute;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 1;
  visibility: visible;
}

.ed-preview-blog-content .tooltip .activated {
  position: absolute;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 0;
  visibility: hidden;
}

.ed-preview-blog-content .text-chunk {
  display: block;
}

/* ================================================================
   相邻兄弟选择器（对照 BlogArticleView 间距规则）
   ================================================================ */
.ed-preview-blog-content mio-code-snippet + p {
  margin-top: 32px;
}

.ed-preview-blog-content mio-code-snippet + ol,
.ed-preview-blog-content mio-code-snippet + ul,
.ed-preview-blog-content figure + ol,
.ed-preview-blog-content figure + ul {
  margin-top: 56px;
}

.ed-preview-blog-content .mio-table + p {
  margin-top: 32px;
}

/* 移动端隐藏 copy-button */
@media screen and (max-width: 1294px) {
  .ed-preview-blog-content .block {
    display: block;
    margin: 64px 0 24px 0;
  }
  .ed-preview-blog-content .copy-button-container {
    display: none;
  }
}

/* ================================================================
   暗色模式（完全对齐 BlogArticleView）
   ================================================================ */
[data-theme="dark"] .ed-preview-overlay {
  background: var(--md-sys-color-surface, #141218);
}

[data-theme="dark"] .ed-preview-toolbar {
  background: var(--md-sys-color-surface, #1c1b1f);
  border-bottom-color: var(--md-sys-color-outline-variant, #49454f);
}

[data-theme="dark"] .ed-preview-toolbar__label {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

/* mio-header 暗色 */
[data-theme="dark"] .ed-preview-primary-container {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

[data-theme="dark"] .ed-preview-date,
[data-theme="dark"] .ed-preview-title-block h1,
[data-theme="dark"] .ed-preview-description {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-split-asset-image {
  border-color: var(--md-sys-color-surface-variant, #49454f);
}

[data-theme="dark"] .ed-preview-split-asset-image__foreground {
  background: linear-gradient(
    135deg,
    var(--md-sys-color-primary-container, #21005d) 0%,
    var(--md-sys-color-secondary-container, #4a4458) 50%,
    var(--md-sys-color-tertiary-container, #633b48) 100%
  );
}

/* authors 暗色 */
[data-theme="dark"] .ed-preview-overline {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

[data-theme="dark"] .ed-preview-author-name {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-author-role {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

[data-theme="dark"] .ed-preview-separator {
  border-top-color: var(--md-sys-color-outline-variant, #49454f);
}

/* blog-content 暗色 */
[data-theme="dark"] .ed-preview-blog-content {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content h2,
[data-theme="dark"] .ed-preview-blog-content h2.linkable {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content h3 {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content p,
[data-theme="dark"] .ed-preview-blog-content li {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content blockquote {
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

[data-theme="dark"] .ed-preview-blog-content code {
  background: var(--md-sys-color-surface-container, #2b292b);
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content pre {
  background: #1c1b1f;
  border-color: var(--md-sys-color-surface-variant, #49454f);
}

[data-theme="dark"] .ed-preview-blog-content strong {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content a {
  color: var(--md-sys-color-primary, #d0bcff);
}

[data-theme="dark"] .ed-preview-blog-content a:hover {
  background: var(--md-sys-color-primary-container, #4a3d6a);
}

[data-theme="dark"] .ed-preview-blog-content table {
  border-color: var(--md-sys-color-surface-variant, #49454f);
}

[data-theme="dark"] .ed-preview-blog-content table th {
  background: var(--md-sys-color-surface-container-low, #1e1b1f);
  color: var(--md-sys-color-on-surface-variant, #cac4d0);
}

[data-theme="dark"] .ed-preview-blog-content table td,
[data-theme="dark"] .ed-preview-blog-content table th {
  border-top-color: var(--md-sys-color-surface-variant, #49454f);
  border-right-color: var(--md-sys-color-surface-variant, #49454f);
}

[data-theme="dark"] .ed-preview-blog-content ol > li::before {
  background: var(--md-sys-color-inverse-surface, #dadce0);
  color: var(--md-sys-color-inverse-on-surface, #1c1b1f);
}

[data-theme="dark"] .ed-preview-blog-content ul li::before {
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.95843 0.279933C5.5378 -0.353974 6.58452 0.173492 6.41974 1.01632L6.05454 2.88412C5.99767 3.17501 6.09646 3.47451 6.31525 3.67447L7.72007 4.95843C8.35397 5.5378 7.82651 6.58452 6.98368 6.41974L5.11588 6.05454C4.82499 5.99767 4.52549 6.09646 4.32553 6.31525L3.04157 7.72007C2.4622 8.35397 1.41548 7.82651 1.58026 6.98368L1.94545 5.11588C2.00233 4.82499 1.90354 4.52549 1.68475 4.32553L0.279933 3.04157C-0.353974 2.4622 0.173492 1.41548 1.01632 1.58026L2.88412 1.94545C3.17501 2.00233 4.47451 1.90354 3.67447 1.68475L4.95843 0.279933Z' fill='%23E3E3E3'/%3E%3C/svg%3E");
}

/* copy-button 暗色 */
[data-theme="dark"] .ed-preview-blog-content .copy-button {
  color: var(--md-sys-color-on-surface, #e6e1e5);
}

[data-theme="dark"] .ed-preview-blog-content .copy-button-background {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant, #cac4d0) 8%, transparent);
}

[data-theme="dark"] .ed-preview-blog-content .tooltip {
  background: #fefbff;
  color: #1f1f1f;
}
</style>
