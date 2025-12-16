## Before

### client/src
```
src
├── __tests__
│   ├── AuthCallback.test.tsx
│   ├── AuthContext.test.tsx
│   ├── ForgotPassword.test.tsx
│   ├── Login.test.tsx
│   ├── ProtectedRoute.test.tsx
│   ├── ResetPassword.test.tsx
│   ├── Signup.test.tsx
│   ├── Upload.test.tsx
│   ├── auth.integration.test.tsx
│   └── setup.ts
├── assets
│   └── react.svg
├── components
│   ├── __tests__
│   │   └── PDFViewer.test.tsx
│   ├── ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── BottomNavigation.tsx
│   ├── EditResourceDialog.tsx
│   ├── ErrorBoundary.tsx
│   ├── PDFViewer.tsx
│   └── ProtectedRoute.tsx
├── contexts
│   └── AuthContext.tsx
├── hooks
├── lib
│   ├── api.ts
│   ├── supabase.ts
│   └── utils.ts
├── pages
│   ├── __tests__
│   │   ├── Home.test.tsx
│   │   └── Upload.test.tsx
│   ├── AuthCallback.tsx
│   ├── ForgotPassword.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── ResetPassword.tsx
│   ├── Signup.tsx
│   ├── Test.tsx
│   └── Upload.tsx
├── App.css
├── App.tsx
├── index.css
└── main.tsx
```

### server/app
```
app
├── db
│   └── __init__.py
├── models
│   ├── __init__.py
│   └── resource.py
├── routes
│   ├── __init__.py
│   ├── objects.py
│   └── resources.py
├── schemas
│   ├── __init__.py
│   ├── gemini.py
│   └── resource.py
├── utils
│   ├── __init__.py
│   ├── auth.py
│   ├── content_extraction.py
│   ├── gemini.py
│   └── supabase.py
├── __init__.py
└── main.py
```

### server/tests
```
tests
├── README.md
├── TEST_STATUS.md
├── __init__.py
├── conftest.py
├── test_gemini_tagging.py
├── test_objects.py
└── test_resources.py
```

## After

### client/src
```
src
├── __tests__
│   ├── AuthCallback.test.tsx
│   ├── AuthContext.test.tsx
│   ├── ForgotPassword.test.tsx
│   ├── Login.test.tsx
│   ├── ProtectedRoute.test.tsx
│   ├── ResetPassword.test.tsx
│   ├── Signup.test.tsx
│   ├── Upload.test.tsx
│   ├── auth.integration.test.tsx
│   └── setup.ts
├── assets
│   └── react.svg
├── components
│   ├── __tests__
│   │   └── PDFViewer.test.tsx
│   ├── ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── BottomNavigation.tsx
│   ├── EditResourceDialog.tsx
│   ├── ErrorBoundary.tsx
│   ├── PDFViewer.tsx
│   └── ProtectedRoute.tsx
├── contexts
│   └── AuthContext.tsx
├── hooks
│   └── useDebouncedValue.ts
├── lib
│   ├── api
│   │   ├── client.ts
│   │   ├── metadata.ts
│   │   ├── objects.ts
│   │   └── resources.ts
│   ├── api.ts
│   ├── supabase.ts
│   └── utils.ts
├── pages
│   ├── __tests__
│   │   ├── Home.test.tsx
│   │   └── Upload.test.tsx
│   ├── home
│   │   ├── components
│   │   ├── HomePage.tsx
│   │   └── useResourceBrowser.ts
│   ├── upload
│   │   ├── components
│   │   ├── UploadPage.tsx
│   │   ├── types.ts
│   │   ├── uploadMetadataActions.ts
│   │   ├── uploadResourceActions.ts
│   │   ├── uploadState.ts
│   │   ├── uploadSubmitActions.ts
│   │   ├── uploadTypeActions.ts
│   │   └── useUploadFlow.ts
│   ├── AuthCallback.tsx
│   ├── ForgotPassword.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── ResetPassword.tsx
│   ├── Signup.tsx
│   ├── Test.tsx
│   └── Upload.tsx
├── App.css
├── App.tsx
├── index.css
└── main.tsx
```

### server/app
```
app
├── db
│   └── __init__.py
├── models
│   ├── __init__.py
│   └── resource.py
├── routes
│   ├── __init__.py
│   ├── objects.py
│   └── resources.py
├── schemas
│   ├── __init__.py
│   ├── gemini.py
│   └── resource.py
├── services
│   ├── __init__.py
│   ├── resource_metadata_service.py
│   └── resource_service.py
├── utils
│   ├── __init__.py
│   ├── auth.py
│   ├── content_extraction.py
│   ├── gemini.py
│   └── supabase.py
├── __init__.py
└── main.py
```

### server/tests
```
tests
├── fixtures
│   ├── __init__.py
│   ├── client.py
│   ├── database.py
│   ├── resources.py
│   └── users.py
├── gemini
│   ├── __init__.py
│   ├── test_content_extraction.py
│   └── test_generate_tags_endpoint.py
├── resources
│   ├── __init__.py
│   ├── test_authentication.py
│   ├── test_create_resource_content_validation.py
│   ├── test_create_resource_success.py
│   ├── test_create_resource_title_and_type.py
│   ├── test_delete_resource.py
│   ├── test_get_resource.py
│   ├── test_link_resource_creation.py
│   ├── test_link_resource_invalid_urls.py
│   ├── test_link_resource_valid_urls.py
│   ├── test_list_resources.py
│   ├── test_pdf_resource_creation.py
│   ├── test_search_content_matching.py
│   ├── test_search_content_primary.py
│   ├── test_search_edge_cases.py
│   ├── test_search_filters_and_permissions.py
│   └── test_update_resource.py
├── README.md
├── TEST_STATUS.md
├── __init__.py
├── conftest.py
└── test_objects.py
```
