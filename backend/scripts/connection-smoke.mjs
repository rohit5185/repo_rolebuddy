#!/usr/bin/env node

/**
 * Connection & Discovery Smoke Test
 * Tests the end-to-end connection and discovery flow
 */

import axios from "axios";
import { URL } from "url";

const BASE_URL = new URL(process.env.API_URL || "http://localhost:5000").toString().slice(0, -1);

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data
let user1 = null;
let user2 = null;
let tokens = {};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function signup(email, role, specialization) {
  try {
    const signupUrl = `${BASE_URL}/api/auth/signup`;
    log(`  POST ${signupUrl}`, "yellow");
    
    const signupResponse = await axios.post(signupUrl, {
      email,
      password: "Password123!",
      confirmPassword: "Password123!"
    });

    log(`  Signup response:`, "yellow");
    log(`    Status: ${signupResponse.status}`, "yellow");
    log(`    Data keys: ${Object.keys(signupResponse.data.data || {})}`, "yellow");

    const signupToken = signupResponse.data.data?.accessToken || signupResponse.data.data?.token;
    
    if (!signupToken) {
      throw new Error("No token in signup response");
    }

    log(`  Token: ${signupToken.substring(0, 20)}...`, "yellow");

    // Complete onboarding
    const onboardingUrl = `${BASE_URL}/api/user/onboarding`;
    log(`  PUT ${onboardingUrl}`, "yellow");
    
    await axios.put(
      onboardingUrl,
      {
        domain: "tech",
        role,
        specialization: specialization || role,
        experience: "mid-level",
        primaryArea: "Backend",
        dailyGoal: 2,
        availabilityTime: "morning",
        availabilityFrequency: "Few times a week",
        goal: "Learning and networking",
        skills: [specialization || role, "Problem solving"],
        intent: "learning"
      },
      {
        headers: { Authorization: `Bearer ${signupToken}` }
      }
    );

    return signupToken;
  } catch (error) {
    log(`  Error in signup: ${error.message}`, "red");
    if (axios.isAxiosError(error)) {
      log(`  URL attempted: ${error.config?.url}`, "red");
      log(`  Status: ${error.response?.status}`, "red");
      if (error.response?.data) {
        console.log(`  Response:`, error.response.data);
      }
    }
    throw error;
  }
}

async function runTests() {
  try {
    log("\n=== Connection & Discovery Smoke Test ===\n", "cyan");
    log(`Base URL: ${BASE_URL}`, "cyan");

    // Test 1: Create two users
    log("1. Creating test users...", "yellow");
    const email1 = `test-conn-1-${Date.now()}@test.com`;
    const email2 = `test-conn-2-${Date.now()}@test.com`;

    const token1 = await signup(email1, "Backend Engineer", "Node.js");
    const token2 = await signup(email2, "Backend Engineer", "Node.js");

    tokens = { user1: token1, user2: token2 };
    log("✓ Users created and onboarded", "green");

    // Test 2: Get user IDs
    log("\n2. Getting user profiles...", "yellow");
    const user1ProfileResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    user1 = user1ProfileResponse.data.data.user;

    const user2ProfileResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    user2 = user2ProfileResponse.data.data.user;

    log(`✓ User 1 ID: ${user1.id}`, "green");
    log(`✓ User 2 ID: ${user2.id}`, "green");

    // Test 3: Generate display names
    log("\n3. Generating display names...", "yellow");
    const displayName1 = await axios.post(
      `${BASE_URL}/api/connection/display-name`,
      {},
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ User 1 display name: ${displayName1.data.displayName}`, "green");

    const displayName2 = await axios.post(
      `${BASE_URL}/api/connection/display-name`,
      {},
      { headers: { Authorization: `Bearer ${token2}` } }
    );
    log(`✓ User 2 display name: ${displayName2.data.displayName}`, "green");

    // Test 4: Get suggestions
    log("\n4. Getting profile suggestions...", "yellow");
    const suggestions = await axios.get(
      `${BASE_URL}/api/connection/suggestions?limit=10`,
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ Found ${suggestions.data.data.length} suggestions`, "green");
    
    if (suggestions.data.data.length > 0) {
      const firstSuggestion = suggestions.data.data[0];
      log(`  - Top match: ${firstSuggestion.displayName} (${firstSuggestion.matchScore}% match)`, "green");
    }

    // Test 5: Send connection request
    log("\n5. Sending connection request...", "yellow");
    const sendRequest = await axios.post(
      `${BASE_URL}/api/connection/request`,
      { toUserId: user2.id },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ Connection request sent: ${sendRequest.data.message}`, "green");

    // Test 6: Get pending requests (as receiver)
    log("\n6. Getting pending requests...", "yellow");
    const pendingRequests = await axios.get(
      `${BASE_URL}/api/connection/requests`,
      { headers: { Authorization: `Bearer ${token2}` } }
    );
    log(`✓ User 2 has ${pendingRequests.data.data.length} pending request(s)`, "green");

    if (pendingRequests.data.data.length > 0) {
      log(`  - From: ${pendingRequests.data.data[0].from.displayName}`, "green");
    }

    // Test 7: Accept connection request
    log("\n7. Accepting connection request...", "yellow");
    const acceptRequest = await axios.post(
      `${BASE_URL}/api/connection/request/accept`,
      { fromUserId: user1.id },
      { headers: { Authorization: `Bearer ${token2}` } }
    );
    log(`✓ ${acceptRequest.data.message}`, "green");

    // Test 8: Verify connection created
    log("\n8. Verifying connections...", "yellow");
    const connections = await axios.get(
      `${BASE_URL}/api/connection/list`,
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ User 1 has ${connections.data.data.length} connection(s)`, "green");

    // Test 9: Search profiles
    log("\n9. Searching profiles...", "yellow");
    const searchResults = await axios.get(
      `${BASE_URL}/api/connection/search?q=Backend&limit=10`,
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ Found ${searchResults.data.data.length} search result(s)`, "green");

    // Test 10: Create conversation (should work now with connections)
    log("\n10. Creating chat conversation...", "yellow");
    const conversation = await axios.post(
      `${BASE_URL}/api/chats/conversations`,
      { partnerId: user2.id },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ Conversation created: ${conversation.data.data.conversation.id}`, "green");

    // Test 11: Send message
    log("\n11. Sending message...", "yellow");
    const message = await axios.post(
      `${BASE_URL}/api/chats/messages`,
      {
        conversationId: conversation.data.data.conversation.id,
        type: "text",
        content: "Hello! Connection system is working!"
      },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    log(`✓ Message sent: ${message.data.data.content}`, "green");

    log("\n=== All tests passed! ===\n", "green");

  } catch (error) {
    log("\n=== Test failed! ===\n", "red");
    
    if (axios.isAxiosError(error)) {
      log(`Error: ${error.response?.data?.message || error.message}`, "red");
      log(`Status: ${error.response?.status}`, "red");
      if (error.response?.data) {
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    } else {
      log(`Error: ${error instanceof Error ? error.message : String(error)}`, "red");
    }
    
    process.exit(1);
  }
}

runTests();
