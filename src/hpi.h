#pragma once
#ifndef __HPI_H__
#define __HPI_H__

#include <fstream>
#include <map>
#include <string>
#include <vector>

class TAHPIFile
{

public:
  TAHPIFile(const std::string &filename);

  auto Files() const -> std::vector<std::string>;
  auto ReadFile(const std::string& name) -> std::string;

private:
  struct Entry
  {
    std::uint32_t offset;
    std::uint32_t file_size;
    std::uint8_t flag;
  };
  std::map<std::string, Entry> entries;
  std::ifstream file;
  std::uint32_t key;

  void readDirectory();
};

#endif