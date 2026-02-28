# Potlink Mobile CI/CD Setup Guide

To fully enable the automated GitHub Actions pipeline for building and releasing Potlink Mobile, you need to complete a few manual setup steps.

## 1. Setup Expo / EAS Credentials (One-time)

Before the CI can build and submit apps automatically, it needs the correct signing credentials (Certificates, Provisioning Profiles, Android Keystore) and API keys for the App Store and Google Play.

1.  **Open terminal** and navigate to the Potlink app folder:
    ```bash
    cd apps/potlink-mobile
    ```
2.  **Generate/Link iOS Credentials**:
    Run the following command and follow the interactive prompts to log in to your Apple Developer account and create the necessary Distribution Certificates and Provisioning Profiles:

    ```bash
    eas credentials
    ```

    Select `iOS` -> `production`.

3.  **Generate/Link Android Credentials**:
    Run the same command for Android to generate a new Keystore (or link an existing one):

    ```bash
    eas credentials
    ```

    Select `Android` -> `production`.

4.  **Setup App Store & Google Play Connect (Crucial for Auto-Submit)**:
    You must trigger a manual submission once to allow EAS to store the App Store Connect API Key and Google Play Service Account Key securely.
    - For iOS: `eas submit --platform ios`
    - For Android: `eas submit --platform android`
      _Note: Follow the CLI prompts to generate and provide the necessary API keys from your Apple/Google developer accounts._

## 2. Setup GitHub Secrets

The GitHub Action (`.github/workflows/deploy-potlink.yml`) requires the following secrets to be set in your repository:

1.  Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **New repository secret** and add the following:
    - `EXPO_TOKEN`:
      - **Where to get it**: Go to [Expo Access Tokens](https://expo.dev/settings/access-tokens) and create a new token. This allows the GitHub Action to authenticate as you.
    - `POTLINK_SUPABASE_URL_PROD`:
      - **Where to get it**: Your Supabase Production Project URL for Potlink.
    - `POTLINK_SUPABASE_ANON_KEY_PROD`:
      - **Where to get it**: Your Supabase Production Project Anon Key for Potlink.

Once these credentials and secrets are in place, the CI/CD pipeline will automatically build and submit Potlink to TestFlight / Google Play Beta whenever code is pushed to the `main` branch.
